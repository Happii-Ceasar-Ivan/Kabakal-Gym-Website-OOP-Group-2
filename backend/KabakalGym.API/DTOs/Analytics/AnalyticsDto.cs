namespace KabakalGym.API.DTOs.Analytics;

public class MonthlyRevenueDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class PeakHourUsageDto
{
    public int Hour { get; set; } // 0-23
    public int VisitCount { get; set; }
}

public class BusinessAnalyticsResponseDto
{
    public MonthlyRevenueDto CurrentMonthRevenue { get; set; } = new();
    public List<PeakHourUsageDto> PeakUsageHistogram { get; set; } = new();
    public int TotalActiveMembers { get; set; }
}
