using KabakalGym.API.Common;

namespace KabakalGym.API.Services.Interfaces;

public interface ICheckInService
{
    /// <summary>
    /// Generates the current 5-minute rolling QR Code payload string.
    /// </summary>
    string GenerateQrPayload();

    /// <summary>
    /// Verifies the scanned payload, enforces the geofence, checks subscription, and logs the Visit.
    /// </summary>
    Task<ServiceResult<string>> VerifyCheckInAsync(Guid userId, string qrPayload, double latitude, double longitude);

    /// <summary>
    /// Gets the live capacity of the gym, using caching to eliminate database queries.
    /// </summary>
    Task<int> GetCurrentCapacityAsync();
}
