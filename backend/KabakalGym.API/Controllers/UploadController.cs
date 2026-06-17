using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using KabakalGym.API.Configuration;
using KabakalGym.API.Models;

namespace KabakalGym.API.Controllers;

/// <summary>
/// Generates cryptographic signatures for Cloudinary direct uploads.
/// The actual image file NEVER touches this server — zero CPU/RAM overhead.
/// </summary>
[ApiController]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    private readonly CloudinarySettings _settings;

    public UploadController(IOptions<CloudinarySettings> settings)
    {
        _settings = settings.Value;
    }

    /// <summary>
    /// Returns a time-limited signature so the frontend can upload directly to Cloudinary.
    /// Only authenticated Admins can generate upload signatures.
    /// </summary>
    [HttpGet("signature")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetSignature()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Cloudinary requires signing: "timestamp={ts}{apiSecret}" → SHA-1 hex digest
        var stringToSign = $"timestamp={timestamp}";
        var signature = GenerateSignature(stringToSign, _settings.ApiSecret);

        return Ok(new
        {
            timestamp,
            signature,
            apiKey     = _settings.ApiKey,
            cloudName  = _settings.CloudName
        });
    }

    /// <summary>
    /// HMAC-free SHA-1 signature as required by Cloudinary's signing spec:
    /// SHA1(paramsToSign + apiSecret) → lowercase hex string.
    /// </summary>
    private static string GenerateSignature(string paramsToSign, string apiSecret)
    {
        var dataToHash = paramsToSign + apiSecret;
        var bytes = SHA1.HashData(Encoding.UTF8.GetBytes(dataToHash));
        return Convert.ToHexStringLower(bytes);
    }
}
