using KabakalGym.API.DTOs.Analytics;

namespace KabakalGym.API.Services.Interfaces;

public interface IAnalyticsService
{
    Task<BusinessAnalyticsResponseDto> GetDashboardAnalyticsAsync(int year, int month);
}
