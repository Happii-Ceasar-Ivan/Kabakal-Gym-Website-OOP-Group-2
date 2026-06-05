using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.Equipment;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Controllers;

[ApiController]
[Route("api/equipment")]
public class EquipmentController : ControllerBase
{
    private readonly IEquipmentService _equipmentService;

    public EquipmentController(IEquipmentService equipmentService)
    {
        _equipmentService = equipmentService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<EquipmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var result = await _equipmentService.GetAllEquipmentAsync(page, pageSize, search);
        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EquipmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _equipmentService.GetEquipmentAsync(id);
        return result.IsSuccess ? Ok(result.Data) : NotFound(new { error = result.ErrorMessage });
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(EquipmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateEquipmentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _equipmentService.CreateEquipmentAsync(dto);
        return StatusCode(StatusCodes.Status201Created, result.Data);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(EquipmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEquipmentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _equipmentService.UpdateEquipmentAsync(id, dto);
        if (!result.IsSuccess)
        {
            if (result.ErrorMessage!.Contains("not found")) return NotFound(new { error = result.ErrorMessage });
            return BadRequest(new { error = result.ErrorMessage });
        }
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _equipmentService.DeleteEquipmentAsync(id);
        return result.IsSuccess ? NoContent() : NotFound(new { error = result.ErrorMessage });
    }

    [HttpPost("upload")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadCsv(IFormFile file)
    {
        var result = await _equipmentService.UploadEquipmentCsvAsync(file);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.ErrorMessage });
        }
        return Ok(new { count = result.Data, message = $"Successfully uploaded {result.Data} equipment records." });
    }
}
