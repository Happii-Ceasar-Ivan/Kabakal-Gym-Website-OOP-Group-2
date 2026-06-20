using KabakalGym.API.DTOs.Analytics;

namespace KabakalGym.API.Services.Interfaces;

public interface IAnalyticsService
{
    Task<BusinessAnalyticsResponseDto> GetDashboardAnalyticsAsync(int year, int month);
    Task<List<HistoricalRevenueDto>> GetHistoricalRevenueAsync(int months);
    Task<string> ExportAndArchiveOldDataAsync(int monthsAgo);
    Task<string> ExportDataAsync(int monthsAgo);
}
