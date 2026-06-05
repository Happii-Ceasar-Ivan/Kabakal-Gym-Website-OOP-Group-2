using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.User;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Controllers;

[ApiController]
[Route("api/members")]
[Authorize(Roles = UserRoles.Admin)]
public class MemberManagementController : ControllerBase
{
    private readonly IMemberManagementService _memberService;
    private readonly ISubscriptionService _subscriptionService;

    public MemberManagementController(IMemberManagementService memberService, ISubscriptionService subscriptionService)
    {
        _memberService = memberService;
        _subscriptionService = subscriptionService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<MemberProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllMembers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var result = await _subscriptionService.GetAllMembersAsync(page, pageSize, search);
        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MemberProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMember(Guid id)
    {
        var result = await _memberService.GetMemberAsync(id);
        return result.IsSuccess ? Ok(result.Data) : NotFound(new { error = result.ErrorMessage });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(MemberProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMember(Guid id, [FromBody] UpdateMemberDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _memberService.UpdateMemberAsync(id, dto);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.ErrorMessage });
    }
}
