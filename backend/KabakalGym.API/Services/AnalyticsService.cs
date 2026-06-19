using KabakalGym.API.Data;
using KabakalGym.API.DTOs.Analytics;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Text;

namespace KabakalGym.API.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly KabakalDbContext _context;
    private readonly IMemoryCache _cache;

    public AnalyticsService(KabakalDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<BusinessAnalyticsResponseDto> GetDashboardAnalyticsAsync(int year, int month)
    {
        string cacheKey = $"AnalyticsV2_Y{year}_M{month}";

        if (_cache.TryGetValue(cacheKey, out BusinessAnalyticsResponseDto? cachedData) && cachedData != null)
        {
            return cachedData;
        }

        // 1. Total Revenue Query
        var totalRevenue = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Timestamp.Year == year && t.Timestamp.Month == month && t.Status == "Paid")
            .SumAsync(t => (decimal?)t.AmountPaid) ?? 0m;

        // 2. Active Members Query
        var totalMembers = await _context.Users
            .Include(u => u.Subscription)
            .AsNoTracking()
            .CountAsync(u => u.Role == "Member" && u.IsActive && u.Subscription != null && u.Subscription.ExpirationDate > DateTime.UtcNow);

        // 3. Walk-ins Query (Transactions == 50)
        var totalWalkIns = await _context.Transactions
            .AsNoTracking()
            .CountAsync(t => t.Timestamp.Year == year && t.Timestamp.Month == month && t.AmountPaid == 50.00m && t.Status == "Paid");

        // 4. Daily Revenue Query
        var monthTransactions = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Timestamp.Year == year && t.Timestamp.Month == month && t.Status == "Paid")
            .Select(t => new { t.Timestamp, t.AmountPaid })
            .ToListAsync();

        var dailyRevenue = monthTransactions
            .GroupBy(t => t.Timestamp.Date)
            .Select(g => new DailyRevenueDto
            {
                Date = g.Key,
                Revenue = g.Sum(x => x.AmountPaid)
            })
            .OrderBy(x => x.Date)
            .ToList();

        // Fill missing days of the month with 0
        int daysInMonth = DateTime.DaysInMonth(year, month);
        var fullDailyRevenue = Enumerable.Range(1, daysInMonth)
            .Select(day => new DateTime(year, month, day))
            .Select(date => new DailyRevenueDto
            {
                Date = date,
                Revenue = dailyRevenue.FirstOrDefault(d => d.Date == date)?.Revenue ?? 0
            })
            .ToList();

        // 5. Peak Hour Usage Histogram
        var monthVisits = await _context.Visits
            .AsNoTracking()
            .Where(v => v.CheckIn.Year == year && v.CheckIn.Month == month)
            .Select(v => v.CheckIn)
            .ToListAsync();

        var histogram = monthVisits
            .Select(utcTime => utcTime.AddHours(8).Hour) // PHT Offset
            .GroupBy(hour => hour)
            .Select(g => new PeakHourUsageDto
            {
                HourOfDay = g.Key,
                VisitCount = g.Count()
            })
            .OrderBy(x => x.HourOfDay)
            .ToList();

        var fullHistogram = Enumerable.Range(0, 24).Select(h => new PeakHourUsageDto
        {
            HourOfDay = h,
            VisitCount = histogram.FirstOrDefault(x => x.HourOfDay == h)?.VisitCount ?? 0
        }).ToList();

        var result = new BusinessAnalyticsResponseDto
        {
            TotalRevenue = totalRevenue,
            ActiveMembersCount = totalMembers,
            TotalWalkIns = totalWalkIns,
            DailyRevenue = fullDailyRevenue,
            PeakUsageHours = fullHistogram
        };

        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(15));
        return result;
    }

    public async Task<List<HistoricalRevenueDto>> GetHistoricalRevenueAsync(int months)
    {
        string cacheKey = $"HistoricalRevenue_{months}";

        if (_cache.TryGetValue(cacheKey, out List<HistoricalRevenueDto>? cachedData) && cachedData != null)
        {
            return cachedData;
        }

        var startDate = DateTime.UtcNow.Date.AddMonths(-months + 1);
        startDate = new DateTime(startDate.Year, startDate.Month, 1, 0, 0, 0, DateTimeKind.Utc); // First day of the starting month

        var recentTransactions = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Timestamp >= startDate && t.Status == "Paid")
            .Select(t => new { t.Timestamp, t.AmountPaid })
            .ToListAsync();

        var historicalData = new List<HistoricalRevenueDto>();

        for (int i = months - 1; i >= 0; i--)
        {
            var targetMonth = DateTime.UtcNow.AddMonths(-i);
            var revenue = recentTransactions
                .Where(t => t.Timestamp.Year == targetMonth.Year && t.Timestamp.Month == targetMonth.Month)
                .Sum(t => t.AmountPaid);

            historicalData.Add(new HistoricalRevenueDto
            {
                MonthName = targetMonth.ToString("MMM yyyy"),
                Revenue = revenue
            });
        }

        _cache.Set(cacheKey, historicalData, TimeSpan.FromHours(1));
        return historicalData;
    }

    public async Task<string> ExportAndArchiveOldDataAsync(int monthsAgo)
    {
        var cutoffDate = DateTime.UtcNow.AddMonths(-monthsAgo);

        // Retrieve old data for CSV
        var oldTransactions = await _context.Transactions
            .Include(t => t.User)
            .Where(t => t.Timestamp < cutoffDate)
            .ToListAsync();

        var oldVisits = await _context.Visits
            .Include(v => v.User)
            .Where(v => v.CheckIn < cutoffDate)
            .ToListAsync();

        // Build CSV
        var sb = new StringBuilder();
        sb.AppendLine("=== ARCHIVED DATA REPORT ===");
        sb.AppendLine($"Export Date: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine($"Cutoff Date: {cutoffDate:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();
        
        sb.AppendLine("--- TRANSACTIONS ---");
        sb.AppendLine("TransactionId,UserId,UserEmail,AmountPaid,PaymentMethod,Status,Timestamp");
        foreach (var t in oldTransactions)
        {
            sb.AppendLine($"{t.TransactionId},{t.UserId},{t.User?.Email},{t.AmountPaid},{t.PaymentMethod},{t.Status},{t.Timestamp:yyyy-MM-dd HH:mm:ss}");
        }

        sb.AppendLine();
        sb.AppendLine("--- VISITS ---");
        sb.AppendLine("VisitId,UserId,UserEmail,CheckIn,IsApproved");
        foreach (var v in oldVisits)
        {
            sb.AppendLine($"{v.VisitId},{v.UserId},{v.User?.Email},{v.CheckIn:yyyy-MM-dd HH:mm:ss},{v.IsApproved}");
        }

        // Use a transaction to ensure safe deletion
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            if (oldTransactions.Any()) _context.Transactions.RemoveRange(oldTransactions);
            if (oldVisits.Any()) _context.Visits.RemoveRange(oldVisits);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            // Clear all analytics cache since we modified data
            if (_cache is MemoryCache memoryCache)
            {
                memoryCache.Compact(1.0);
            }
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw; // Let the controller handle 500 error
        }

        return sb.ToString();
    }
}
