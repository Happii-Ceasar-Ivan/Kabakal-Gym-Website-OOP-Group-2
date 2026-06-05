using KabakalGym.API.Common;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.User;

namespace KabakalGym.API.Services.Interfaces;

public interface IMemberManagementService
{
    Task<ServiceResult<MemberProfileDto>> GetMemberAsync(Guid userId);
    Task<ServiceResult<MemberProfileDto>> UpdateMemberAsync(Guid userId, UpdateMemberDto dto);
}
