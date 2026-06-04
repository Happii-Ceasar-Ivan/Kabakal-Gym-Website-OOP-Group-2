using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using KabakalGym.API.Data;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using KabakalGym.API.Configuration;
using KabakalGym.API.Models;
using KabakalGym.API.Services;
using KabakalGym.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ── 1. DATABASE ────────────────────────────────────────────────────────────
// Connection string is read from appsettings.json in development.
// In production (Azure App Service), override via environment variable:
//   CONNECTIONSTRINGS__NEONPOSTGRES="Host=...;Port=5432;..."
// This environment variable takes precedence over the config file — the
// plain-text template in appsettings.json is NEVER used in production.

var connectionString = builder.Configuration.GetConnectionString("NeonPostgres")
    ?? throw new InvalidOperationException(
        "[FATAL] Connection string 'NeonPostgres' is not configured. " +
        "Set the CONNECTIONSTRINGS__NEONPOSTGRES environment variable on the server."
    );

builder.Services.AddDbContext<KabakalDbContext>(options =>
    options
        .UseNpgsql(connectionString, npgsql =>
        {
            // Resilient connection: retry on transient Neon.tech cold-start failures
            npgsql.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null
            );
        })
        // Global no-tracking for read-heavy queries — call .AsTracking() only
        // when you intend to modify and save the entity back to the DB
        .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTrackingWithIdentityResolution)
);

// ── JWT Settings (bound options — injected into AuthService via IOptions<JwtSettings>) ──
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(JwtSettings.SectionName)
);

// ── Auth Services ──
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// ── Email Service (Resend) ──
builder.Services.AddHttpClient<IEmailService, ResendEmailService>();

// ── Sprint 3: Subscription & Transaction Services ──
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<ITransactionService,  TransactionService>();

// ── JWT Bearer Authentication ──
// Read settings here for TokenValidationParameters — IOptions not available yet at this stage
var jwtSettings = builder.Configuration
    .GetSection(JwtSettings.SectionName)
    .Get<JwtSettings>()
    ?? throw new InvalidOperationException(
        "[FATAL] JWT settings section is missing. Add 'Jwt' to appsettings.json."
    );

if (jwtSettings.SecretKey.Length < 64)
    throw new InvalidOperationException(
        "[FATAL] JWT SecretKey must be at least 64 characters for HMAC-SHA512. " +
        "Set JWT__SECRETKEY environment variable."
    );

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtSettings.Issuer,
            ValidAudience            = jwtSettings.Audience,
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SecretKey)
            ),
            // Zero clock skew: token expires exactly at ExpiresAt — no grace window
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

// ── 2. RATE LIMITING (built-in .NET 8 middleware — no extra NuGet) ─────────
builder.Services.AddRateLimiter(options =>
{
    // Global fixed-window policy: 100 requests / 60 seconds per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        context => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit            = 100,
                Window                 = TimeSpan.FromSeconds(60),
                QueueProcessingOrder   = QueueProcessingOrder.OldestFirst,
                QueueLimit             = 5
            }
        )
    );

    // Stricter policy for auth endpoints (Sprint 2) — prevents brute-force
    // 10 requests / 10 minutes per IP on /api/auth/*
    options.AddFixedWindowLimiter("AuthPolicy", limiterOptions =>
    {
        limiterOptions.PermitLimit          = 10;
        limiterOptions.Window               = TimeSpan.FromMinutes(10);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit           = 0;
    });

    // Ultra-strict policy for password reset — protects Resend free-tier quota
    // 3 requests / 15 minutes per IP on /api/auth/forgot-password
    options.AddFixedWindowLimiter("ResetPolicy", limiterOptions =>
    {
        limiterOptions.PermitLimit          = 3;
        limiterOptions.Window               = TimeSpan.FromMinutes(15);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit           = 0;
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers["Retry-After"] = "60";
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Zamn bro Kabakal! You that forgetful?" }, cancellationToken
        );
    };
});

// ── 3. CORS ────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("KabakalCors", policy =>
        policy
            .WithOrigins(
                builder.Configuration.GetSection("AllowedOrigins")
                    .Get<string[]>() ?? ["http://localhost:5500", "http://localhost:5173"]
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
    );
});

// ── 4. MVC / API ───────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ── SWAGGER JWT SUPPORT ────────────────────────────────────────────────────
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Kabakal Gym API",
        Version     = "v1",
        Description = "Backend API for the Kabakal Gym Management and Analytics WebApp",
    });

    // Adds the "Authorize" lock icon to Swagger UI so JWT tokens
    // can be pasted in and all protected endpoints tested directly.
    var securityScheme = new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Description  = "Enter: Bearer {your-jwt-token}",
        Type         = SecuritySchemeType.ApiKey,
        Scheme       = JwtBearerDefaults.AuthenticationScheme,
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Reference    = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id   = JwtBearerDefaults.AuthenticationScheme,
        },
    };

    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

// ── 5. BUILD & MIDDLEWARE PIPELINE ─────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Kabakal Gym API v1"));
}
else
{
    // In Production, return a clean JSON error instead of an HTML stack trace
    // if a database constraint or unexpected error occurs.
    app.UseExceptionHandler(errorApp => 
    {
        errorApp.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { Error = "An unexpected server error occurred." });
        });
    });
}

// Only enforce HTTPS redirection in production — in development the backend
// listens on HTTP only, so this middleware would redirect to a non-existent
// HTTPS port and break frontend fetch() calls.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS MUST go before Rate Limiting, otherwise browser OPTIONS (preflight) requests
// will get rate-limited and block the frontend completely.
app.UseCors("KabakalCors");
app.UseRateLimiter();           
app.UseAuthentication();        // Wired up in Sprint 2 (JWT + Identity)
app.UseAuthorization();
app.MapControllers();

// ── 6. AUTO-MIGRATE ON STARTUP ──────────────────────────────────────────────────
// Automatically apply pending migrations to the database.
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<KabakalDbContext>();
await db.Database.MigrateAsync();

app.Run();