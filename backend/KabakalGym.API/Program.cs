using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using KabakalGym.API.Data;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using KabakalGym.API.Configuration;
using KabakalGym.API.Models;
using KabakalGym.API.Services;
using KabakalGym.API.Services.Interfaces;

// ==============================================================================
// KABAKAL GYM API - STARTUP CONFIGURATION
// ==============================================================================
// Welcome to Program.cs! This file is the "entry point" of our web API.
// Think of it as a recipe book that tells the application exactly how to set
// itself up before it starts listening for requests from users.
// We configure databases, security rules, and extra tools here.
// ==============================================================================

var builder = WebApplication.CreateBuilder(args);

// ──────────────────────────────────────────────────────────────────────────────
// 1. DATABASE CONNECTION
// ──────────────────────────────────────────────────────────────────────────────
// This section connects our app to a PostgreSQL database.
// The "connection string" acts like a secret address and password for our database.

var connectionString = builder.Configuration.GetConnectionString("NeonPostgres")
    ?? throw new InvalidOperationException(
        "[FATAL ERROR] Oops! We couldn't find the 'NeonPostgres' connection string. " +
        "Make sure to set the CONNECTIONSTRINGS__NEONPOSTGRES environment variable."
    );

// We use 'DbContextPool' to efficiently manage database connections.
builder.Services.AddDbContextPool<KabakalDbContext>(options =>
    options
        .UseNpgsql(connectionString, npgsql =>
        {
            // If the database connection blinks or fails momentarily, try again up to 5 times.
            // This makes our app more reliable (resilient).
            npgsql.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null
            );
        })
        // 'NoTracking' makes reading data much faster because the app doesn't
        // keep track of every single change unless we explicitly tell it to.
        .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTrackingWithIdentityResolution)
);

// ──────────────────────────────────────────────────────────────────────────────
// 2. DEPENDENCY INJECTION (Services)
// ──────────────────────────────────────────────────────────────────────────────
// Dependency Injection (DI) is a way for our application to share tools and services.
// Whenever a Controller needs a service (like checking a password or sending an email),
// DI automatically gives it a ready-to-use version of that service.

// Settings for our JSON Web Tokens (JWT) used for user logins.
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(JwtSettings.SectionName)
);

// --- User Authentication and Passwords ---
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// --- Email Notifications ---
builder.Services.AddHttpClient<IEmailService, BrevoEmailService>();

// --- Sprint 3: Subscriptions & Transactions ---
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();

// --- Sprint 3: Gym Members & Equipment ---
builder.Services.AddScoped<IMemberManagementService, MemberManagementService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();

// --- Sprint 5: Checking in & Locations ---
builder.Services.AddScoped<ICheckInService, CheckInService>();

// --- Sprint 6: AI Chatbot (Gemini) ---
builder.Services.Configure<GeminiSettings>(
    builder.Configuration.GetSection(GeminiSettings.SectionName)
);
builder.Services.AddHttpClient<IAiChatService, AiChatService>();
builder.Services.AddHttpClient<IWorkoutGeneratorService, WorkoutGeneratorService>();

// --- Sprint 7: Business Analytics (Graphs & Charts) ---
builder.Services.AddMemoryCache(); // Stores data temporarily for quick access
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

// --- Sprint 8: Payments (Xendit) ---
builder.Services.Configure<XenditSettings>(
    builder.Configuration.GetSection(XenditSettings.SectionName)
);
builder.Services.AddHttpClient<IPaymentGatewayService, XenditService>();

// --- Cloudinary Settings (For uploading pictures) ---
builder.Services.Configure<CloudinarySettings>(
    builder.Configuration.GetSection(CloudinarySettings.SectionName)
);

// ──────────────────────────────────────────────────────────────────────────────
// 3. SECURITY (JWT Authentication)
// ──────────────────────────────────────────────────────────────────────────────
// Authentication verifies WHO a user is. We use JWT (JSON Web Tokens) for this.
// A token is like a digital VIP pass that users show to access protected areas.

var jwtSettings = builder.Configuration
    .GetSection(JwtSettings.SectionName)
    .Get<JwtSettings>()
    ?? throw new InvalidOperationException(
        "[FATAL ERROR] The JWT settings are missing from appsettings.json!"
    );

// The secret key acts as the 'signature' for our tokens, proving we made them.
if (jwtSettings.SecretKey.Length < 64)
    throw new InvalidOperationException(
        "[FATAL ERROR] For security reasons, the JWT Secret Key must be at least 64 characters long."
    );

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Here we configure the rules for validating tokens.
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,           // Ensure the token came from us
            ValidateAudience = true,         // Ensure the token is meant for this app
            ValidateLifetime = true,         // Ensure the token hasn't expired
            ValidateIssuerSigningKey = true, // Verify the signature is correct
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SecretKey)
            ),
            ClockSkew = TimeSpan.Zero,       // Tokens expire exactly when they say they do (no extra time)
        };
    });

// Authorization verifies WHAT a user is allowed to do once they are logged in.
builder.Services.AddAuthorization();

// ──────────────────────────────────────────────────────────────────────────────
// 4. PERFORMANCE BOOSTERS
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddMemoryCache();          // Basic caching
builder.Services.AddResponseCaching();      // Caches responses to common requests
builder.Services.AddResponseCompression(options =>
{
    // Compresses data (like zip files) before sending it to the user, making it faster.
    options.EnableForHttps = true;
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. RATE LIMITING (Preventing Spam and Abuse)
// ──────────────────────────────────────────────────────────────────────────────
// Rate Limiting restricts how many requests a user can make in a certain time.
// This prevents hackers from overwhelming our server or guessing passwords.

builder.Services.AddRateLimiter(options =>
{
    // Global Rule: Allow a maximum of 100 requests every 60 seconds per user IP.
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        context => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromSeconds(60),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 5 // Allow 5 requests to wait in line if they exceed the limit
            }
        )
    );

    // Auth Rule: Specifically protect login and registration from spam (10 per 10 minutes).
    options.AddPolicy("AuthPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(10),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Reset Password Rule: Extra strict to save our free email quota (3 per 15 mins).
    options.AddPolicy("ResetPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(15),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // AI Chatbot Rule: Limit chat messages to prevent huge bills (20 per 30 mins).
    options.AddPolicy("AiChatPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(30),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // What happens if someone breaks the rules? We send them this error message!
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers["Retry-After"] = "60";
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Whoa there! You're moving too fast. Please wait a minute and try again." }, cancellationToken
        );
    };
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. CORS (Cross-Origin Resource Sharing)
// ──────────────────────────────────────────────────────────────────────────────
// By default, web browsers block our frontend (React/Vite) from talking to this backend
// if they are on different addresses. CORS safely opens a bridge between them.

builder.Services.AddCors(options =>
{
    options.AddPolicy("KabakalCors", policy =>
        policy
            .WithOrigins(
                // Allow our specific frontends to talk to this backend
                builder.Configuration.GetSection("AllowedOrigins")
                    .Get<string[]>() ?? ["http://localhost:5500", "http://localhost:5173"]
            )
            .AllowAnyMethod() // Allow GET, POST, PUT, DELETE, etc.
            .AllowAnyHeader() // Allow any special headers in the request
            .AllowCredentials() // Allow sending cookies/tokens
    );
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. API SETUP AND SWAGGER (Documentation)
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger generates a beautiful, interactive manual for our API so developers
// can easily test it and see all the available endpoints.
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Kabakal Gym API",
        Version = "v1",
        Description = "The central nervous system for the Kabakal Gym App.",
    });

    // This section adds an "Authorize" button to Swagger so we can test secured endpoints.
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Paste your JWT token here (Format: Bearer YOUR_TOKEN_HERE)",
        Type = SecuritySchemeType.ApiKey,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = JwtBearerDefaults.AuthenticationScheme,
        },
    };

    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

// ==============================================================================
// BUILDING THE PIPELINE (Middleware)
// ==============================================================================
// The "Pipeline" is the journey a user's request takes through our application.
// The order of these components (middleware) is EXTREMELY important.
var app = builder.Build();

// Ensure IP addresses are recorded correctly when deployed to cloud servers.
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// If we are developing locally (not in production), show the Swagger documentation.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Kabakal Gym API v1"));
}
else
{
    // In Production (when real users are using it), hide messy crash details
    // and just show a clean, friendly error message.
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

// Redirect all HTTP traffic to secure HTTPS in production.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// ──────────────────────────────────────────────────────────────────────────────
// SECURITY HEADERS
// ──────────────────────────────────────────────────────────────────────────────
// Add extra layers of defense against common web attacks.
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY"); // Prevent our app from being put in an iframe
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff"); // Stop browsers from guessing file types
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next(); // Pass the request to the next step
});

app.UseStaticFiles();

// ──────────────────────────────────────────────────────────────────────────────
// CORE MIDDLEWARE EXECUTION
// ──────────────────────────────────────────────────────────────────────────────
// CORS must be first so the browser allows the connection!
app.UseCors("KabakalCors");

// Apply our performance boosters
app.UseResponseCompression();
app.UseResponseCaching();

// Protect the server from spam
app.UseRateLimiter();           

// Identify the user and check what they are allowed to do
app.UseAuthentication();        
app.UseAuthorization();

// Route the request to the correct Controller logic
app.MapControllers();

// A simple endpoint to quickly check if the server is awake and running.
app.MapGet("/api/wakeup", () => Results.Ok(new { status = "Awake", message = "Server is ready to pump iron!" }));

// ──────────────────────────────────────────────────────────────────────────────
// DATABASE MIGRATIONS AND DATA SEEDING
// ──────────────────────────────────────────────────────────────────────────────
// Right before the app starts taking requests, we prepare the database.

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<KabakalDbContext>();

// Automatically apply any new database structure changes (migrations).
await db.Database.MigrateAsync();

// Inject some starting data (like a default admin user) if it doesn't exist yet.
await DbSeeder.SeedAdminAsync(app.Services);
await DbSeeder.SeedDummyAnalyticsDataAsync(app.Services);

// Start the engine! The server is now running and listening.
app.Run();