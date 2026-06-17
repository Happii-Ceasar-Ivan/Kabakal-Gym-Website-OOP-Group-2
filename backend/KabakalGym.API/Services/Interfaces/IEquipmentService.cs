using KabakalGym.API.Common;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.Equipment;

namespace KabakalGym.API.Services.Interfaces;

public interface IEquipmentService
{
    Task<ServiceResult<PagedResultDto<EquipmentDto>>> GetAllEquipmentAsync(int page, int pageSize, string? search);
    Task<ServiceResult<EquipmentDto>> GetEquipmentAsync(Guid id);
    Task<ServiceResult<EquipmentDto>> CreateEquipmentAsync(CreateEquipmentDto dto);
    Task<ServiceResult<int>> BulkCreateEquipmentAsync(BulkCreateEquipmentRequestDto req);
    Task<ServiceResult<EquipmentDto>> UpdateEquipmentAsync(Guid id, UpdateEquipmentDto dto);
    Task<ServiceResult<bool>> DeleteEquipmentAsync(Guid id);
    Task<ServiceResult<int>> UploadEquipmentCsvAsync(IFormFile file);
    Task<ServiceResult<string>> UpdateEquipmentImageUrlAsync(Guid id, string imageUrl);
}
