using KabakalGym.API.Data;
using KabakalGym.API.DTOs.Analytics;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

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
        string cacheKey = $"Analytics_Y{year}_M{month}";

        if (_cache.TryGetValue(cacheKey, out BusinessAnalyticsResponseDto? cachedData) && cachedData != null)
        {
            return cachedData;
        }

        // 1. Monthly Revenue Query
        var revenue = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Timestamp.Year == year && t.Timestamp.Month == month)
            .SumAsync(t => t.AmountPaid);

        // 2. Total Active Members Query
        var totalMembers = await _context.Users
            .AsNoTracking()
            .CountAsync(u => u.Role == "Member" && u.IsActive);

        // 3. Peak Hour Usage Histogram (Grouping by CheckIn Hour)
        // Since CheckIn is UTC, we offset it by +8 for PHT. Postgres EXTRACT does not easily offset dynamically in EF without Raw SQL,
        // so we retrieve the data, offset it, and group in memory. 
        // To be safe for Neon, we only retrieve visits for the requested month.
        var monthVisits = await _context.Visits
            .AsNoTracking()
            .Where(v => v.CheckIn.Year == year && v.CheckIn.Month == month)
            .Select(v => v.CheckIn)
            .ToListAsync();

        var histogram = monthVisits
            .Select(utcTime => utcTime.AddHours(8).Hour)
            .GroupBy(hour => hour)
            .Select(g => new PeakHourUsageDto
            {
                Hour = g.Key,
                VisitCount = g.Count()
            })
            .OrderBy(x => x.Hour)
            .ToList();

        // Ensure all 24 hours are represented
        var fullHistogram = Enumerable.Range(0, 24).Select(h => new PeakHourUsageDto
        {
            Hour = h,
            VisitCount = histogram.FirstOrDefault(x => x.Hour == h)?.VisitCount ?? 0
        }).ToList();

        var result = new BusinessAnalyticsResponseDto
        {
            CurrentMonthRevenue = new MonthlyRevenueDto
            {
                Year = year,
                Month = month,
                TotalRevenue = revenue
            },
            TotalActiveMembers = totalMembers,
            PeakUsageHistogram = fullHistogram
        };

        // Cache for 15 minutes
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(15));

        return result;
    }
}
