namespace KabakalGym.API.DTOs.Analytics;

public class DailyRevenueDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
}

public class PeakHourUsageDto
{
    public int HourOfDay { get; set; } // 0-23
    public int VisitCount { get; set; }
}

public class BusinessAnalyticsResponseDto
{
    public decimal TotalRevenue { get; set; }
    public int ActiveMembersCount { get; set; }
    public int TotalWalkIns { get; set; }
    public List<DailyRevenueDto> DailyRevenue { get; set; } = new();
    public List<PeakHourUsageDto> PeakUsageHours { get; set; } = new();
}

public class HistoricalRevenueDto
{
    public string MonthName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
}
