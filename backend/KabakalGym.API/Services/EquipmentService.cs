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
}
