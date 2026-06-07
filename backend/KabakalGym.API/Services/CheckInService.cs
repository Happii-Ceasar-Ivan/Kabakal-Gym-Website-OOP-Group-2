using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using KabakalGym.API.Data;
using KabakalGym.API.Models;
using KabakalGym.API.Common;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Services;

public class CheckInService : ICheckInService
{
    private readonly KabakalDbContext _context;
    private readonly IConfiguration _config;
    
    // Gym Location: 47 Kalayaan B, Batasan Hills, Quezon City
    private const double GYM_LATITUDE = 14.691170847692042;
    private const double GYM_LONGITUDE = 121.08956444186192;
    private const double MAX_DISTANCE_METERS = 15.0;
    
    // 5 minutes per QR code window
    private const int WINDOW_MINUTES = 5;

    public CheckInService(KabakalDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public string GenerateQrPayload()
    {
        return GeneratePayloadForWindow(GetCurrentTimeWindow());
    }

    public async Task<ServiceResult<string>> VerifyCheckInAsync(Guid userId, string qrPayload, double latitude, double longitude)
    {
        // 1. Validate Geofence
        double distance = CalculateDistanceMeters(latitude, longitude, GYM_LATITUDE, GYM_LONGITUDE);
        if (distance > MAX_DISTANCE_METERS)
        {
            return ServiceResult<string>.Fail($"Geofence violation: You are {Math.Round(distance)} meters away. You must be within {MAX_DISTANCE_METERS} meters of the gym to check in.");
        }

        // 2. Validate QR Payload (Anti-Screenshot)
        // Check current window and previous window (in case they scan right at the exact second it changes)
        long currentWindow = GetCurrentTimeWindow();
        if (qrPayload != GeneratePayloadForWindow(currentWindow) && 
            qrPayload != GeneratePayloadForWindow(currentWindow - 1))
        {
            return ServiceResult<string>.Fail("Invalid or expired QR code. Please scan the current code on the kiosk.");
        }

        // 3. Process Check-in / Check-out
        var user = await _context.Users
            .Include(u => u.Subscription)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            return ServiceResult<string>.Fail("User not found.");

        // Check if user has an open visit
        var openVisit = await _context.Visits
            .Where(v => v.UserId == userId && v.CheckOut == null)
            .OrderByDescending(v => v.CheckIn)
            .FirstOrDefaultAsync();

        if (openVisit != null)
            return await ProcessCheckOutAsync(openVisit);
        else
            return await ProcessCheckInAsync(user);
    }

    private async Task<ServiceResult<string>> ProcessCheckInAsync(User user)
    {
        // Determine if they have an active subscription
        bool hasActiveSub = user.Subscription != null && 
                            user.Subscription.PaymentStatus == "Paid" && 
                            user.Subscription.ExpirationDate >= DateTime.UtcNow;

        var visit = new Visit
        {
            UserId = user.UserId,
            CheckIn = DateTime.UtcNow,
            IsApproved = hasActiveSub // If false, Staff must approve
        };

        _context.Visits.Add(visit);
        await _context.SaveChangesAsync();

        if (hasActiveSub)
            return ServiceResult<string>.Success("Check-in successful! Welcome to Kabakal Gym.");
        else
            return ServiceResult<string>.Success("Check-in recorded. Please pay the ₱50 Day Pass fee at the front desk.");
    }

    private async Task<ServiceResult<string>> ProcessCheckOutAsync(Visit visit)
    {
        // They are checking out
        visit.CheckOut = DateTime.UtcNow;
        _context.Visits.Update(visit);
        await _context.SaveChangesAsync();
        
        var duration = visit.CheckOut.Value - visit.CheckIn;
        string durationStr = $"{(int)duration.TotalHours}h {duration.Minutes}m";

        return ServiceResult<string>.Success($"Check-out successful! You worked out for {durationStr}. See you next time!");
    }

    // ── Helper Methods ───────────────────────────────────────────────────

    private long GetCurrentTimeWindow()
    {
        // Convert Unix Epoch time to 5-minute windows
        return DateTimeOffset.UtcNow.ToUnixTimeSeconds() / (WINDOW_MINUTES * 60);
    }

    private string GeneratePayloadForWindow(long window)
    {
        // We hash the window number with a secret key from configuration
        // If no secret key is configured, fallback to a hardcoded constant for development
        string secret = _config["QrSecretKey"] ?? "SUPER_SECRET_KABAKAL_DEV_KEY_123!";
        
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        byte[] hashBytes = hmac.ComputeHash(BitConverter.GetBytes(window));
        
        return Convert.ToBase64String(hashBytes);
    }

    /// <summary>
    /// Haversine formula to calculate accurate distance between two GPS points.
    /// </summary>
    private double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371e3; // Earth radius in meters
        double phi1 = lat1 * Math.PI / 180;
        double phi2 = lat2 * Math.PI / 180;
        double deltaPhi = (lat2 - lat1) * Math.PI / 180;
        double deltaLambda = (lon2 - lon1) * Math.PI / 180;

        double a = Math.Sin(deltaPhi / 2) * Math.Sin(deltaPhi / 2) +
                   Math.Cos(phi1) * Math.Cos(phi2) *
                   Math.Sin(deltaLambda / 2) * Math.Sin(deltaLambda / 2);
        
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }
}
