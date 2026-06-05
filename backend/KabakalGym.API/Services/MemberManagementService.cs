using Microsoft.EntityFrameworkCore;
using KabakalGym.API.Common;
using KabakalGym.API.Data;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.User;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Services;

public sealed class MemberManagementService : IMemberManagementService
{
    private readonly KabakalDbContext _context;

    public MemberManagementService(KabakalDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<MemberProfileDto>> GetMemberAsync(Guid userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Subscription)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            return ServiceResult<MemberProfileDto>.Fail("Member not found.");

        var dto = new MemberProfileDto(
            user.UserId,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.IsActive,
            user.Subscription?.PaymentStatus,
            user.Subscription?.ExpirationDate,
            user.Subscription == null 
                || user.Subscription.PaymentStatus != PaymentStatuses.Paid 
                || (user.Subscription.ExpirationDate.HasValue && user.Subscription.ExpirationDate.Value < DateTime.UtcNow)
        );

        return ServiceResult<MemberProfileDto>.Success(dto);
    }

    public async Task<ServiceResult<MemberProfileDto>> UpdateMemberAsync(Guid userId, UpdateMemberDto dto)
    {
        var user = await _context.Users
            .AsTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            return ServiceResult<MemberProfileDto>.Fail("Member not found.");

        // Check if email is being changed and is already taken
        var normalizedEmail = dto.Email.ToLower().Trim();
        if (user.Email != normalizedEmail)
        {
            var emailTaken = await _context.Users.AnyAsync(u => u.Email == normalizedEmail);
            if (emailTaken)
                return ServiceResult<MemberProfileDto>.Fail("Email is already in use by another account.");
            
            user.Email = normalizedEmail;
        }

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return await GetMemberAsync(userId);
    }
}
