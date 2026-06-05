using Microsoft.EntityFrameworkCore;
using KabakalGym.API.Common;
using KabakalGym.API.Data;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.Equipment;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Services;

public sealed class EquipmentService : IEquipmentService
{
    private readonly KabakalDbContext _context;

    public EquipmentService(KabakalDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<PagedResultDto<EquipmentDto>>> GetAllEquipmentAsync(int page, int pageSize, string? search)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _context.Equipments.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(e => e.EquipmentName.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(e => e.EquipmentName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EquipmentDto(e.EquipmentId, e.EquipmentName, e.EquipmentStatus, e.IsActive))
            .ToListAsync();

        return ServiceResult<PagedResultDto<EquipmentDto>>.Success(
            PagedResultDto<EquipmentDto>.Create(items, totalCount, page, pageSize)
        );
    }

    public async Task<ServiceResult<EquipmentDto>> GetEquipmentAsync(Guid id)
    {
        var eq = await _context.Equipments.AsNoTracking().FirstOrDefaultAsync(e => e.EquipmentId == id);
        if (eq == null) return ServiceResult<EquipmentDto>.Fail("Equipment not found.");

        return ServiceResult<EquipmentDto>.Success(new EquipmentDto(eq.EquipmentId, eq.EquipmentName, eq.EquipmentStatus, eq.IsActive));
    }

    public async Task<ServiceResult<EquipmentDto>> CreateEquipmentAsync(CreateEquipmentDto dto)
    {
        var eq = new Equipment
        {
            EquipmentId = Guid.NewGuid(),
            EquipmentName = dto.EquipmentName.Trim(),
            EquipmentStatus = "Available",
            IsActive = true
        };

        _context.Equipments.Add(eq);
        await _context.SaveChangesAsync();

        return ServiceResult<EquipmentDto>.Success(new EquipmentDto(eq.EquipmentId, eq.EquipmentName, eq.EquipmentStatus, eq.IsActive));
    }

    public async Task<ServiceResult<EquipmentDto>> UpdateEquipmentAsync(Guid id, UpdateEquipmentDto dto)
    {
        var eq = await _context.Equipments.AsTracking().FirstOrDefaultAsync(e => e.EquipmentId == id);
        if (eq == null) return ServiceResult<EquipmentDto>.Fail("Equipment not found.");

        var validStatuses = new[] { "Available", "Under Maintenance", "Unavailable" };
        if (!validStatuses.Contains(dto.EquipmentStatus))
            return ServiceResult<EquipmentDto>.Fail($"Invalid EquipmentStatus. Must be one of: {string.Join(", ", validStatuses)}.");

        eq.EquipmentName = dto.EquipmentName.Trim();
        eq.EquipmentStatus = dto.EquipmentStatus;
        eq.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return ServiceResult<EquipmentDto>.Success(new EquipmentDto(eq.EquipmentId, eq.EquipmentName, eq.EquipmentStatus, eq.IsActive));
    }

    public async Task<ServiceResult<bool>> DeleteEquipmentAsync(Guid id)
    {
        var eq = await _context.Equipments.AsTracking().FirstOrDefaultAsync(e => e.EquipmentId == id);
        if (eq == null) return ServiceResult<bool>.Fail("Equipment not found.");

        // Soft delete
        eq.IsActive = false;
        eq.EquipmentStatus = "Unavailable";
        await _context.SaveChangesAsync();

        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<int>> UploadEquipmentCsvAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return ServiceResult<int>.Fail("File is empty.");

        if (file.Length > 5 * 1024 * 1024)
            return ServiceResult<int>.Fail("File size exceeds the 5MB limit.");

        var extension = Path.GetExtension(file.FileName).ToLower();
        if (extension != ".csv")
            return ServiceResult<int>.Fail("Invalid file type. Only .csv is allowed.");

        var newEquipments = new List<Equipment>();
        int addedCount = 0;

        using var stream = new StreamReader(file.OpenReadStream());
        
        // Read header
        var headerLine = await stream.ReadLineAsync();
        if (string.IsNullOrWhiteSpace(headerLine))
            return ServiceResult<int>.Fail("CSV is empty or missing headers.");

        // We expect: EquipmentName,EquipmentStatus,IsActive
        
        // Pre-fetch existing equipment names for the "x2" logic
        var existingNames = await _context.Equipments
            .AsNoTracking()
            .Select(e => e.EquipmentName)
            .ToListAsync();

        // Count occurrences of base names to handle duplicates like "Treadmill x2"
        var baseNameCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var name in existingNames)
        {
            // Try to extract base name and count. e.g. "Treadmill x2" -> base "Treadmill", count 2
            var baseName = name;
            int count = 1;
            
            var lastSpaceIndex = name.LastIndexOf(" x");
            if (lastSpaceIndex != -1 && lastSpaceIndex < name.Length - 2)
            {
                var possibleNumber = name.Substring(lastSpaceIndex + 2);
                if (int.TryParse(possibleNumber, out int parsedCount))
                {
                    baseName = name.Substring(0, lastSpaceIndex);
                    count = parsedCount;
                }
            }

            if (!baseNameCounts.ContainsKey(baseName))
            {
                baseNameCounts[baseName] = count;
            }
            else
            {
                baseNameCounts[baseName] = Math.Max(baseNameCounts[baseName], count);
            }
        }

        string? line;
        while ((line = await stream.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            var columns = line.Split(',');
            if (columns.Length < 1) continue;

            var baseName = columns[0].Trim();
            if (string.IsNullOrEmpty(baseName)) continue;

            string finalName = baseName;

            // Handle duplicate logic
            if (baseNameCounts.ContainsKey(baseName))
            {
                baseNameCounts[baseName]++;
                finalName = $"{baseName} x{baseNameCounts[baseName]}";
            }
            else
            {
                baseNameCounts[baseName] = 1;
                // If it's the very first one, we just use the baseName
            }

            var status = columns.Length > 1 && !string.IsNullOrWhiteSpace(columns[1]) 
                ? columns[1].Trim() 
                : "Available";

            var validStatuses = new[] { "Available", "Under Maintenance", "Unavailable" };
            if (!validStatuses.Contains(status)) status = "Available";

            bool isActive = true;
            if (columns.Length > 2 && bool.TryParse(columns[2].Trim(), out bool parsedActive))
            {
                isActive = parsedActive;
            }

            var eq = new Equipment
            {
                EquipmentId = Guid.NewGuid(),
                EquipmentName = finalName,
                EquipmentStatus = status,
                IsActive = isActive
            };

            newEquipments.Add(eq);
            addedCount++;
        }

        if (newEquipments.Any())
        {
            // By using EF Core AddRange, we are protected from SQL Injection automatically
            _context.Equipments.AddRange(newEquipments);
            await _context.SaveChangesAsync();
        }

        return ServiceResult<int>.Success(addedCount);
    }
}
