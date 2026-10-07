using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Backend_Sub33.Data;
using Backend_Sub33.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Base de datos PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQL")));

// 1.1 Servicios de negocio (DI)
builder.Services.AddScoped<IPersonalService, PersonalService>();
builder.Services.AddScoped<IRangoService, RangoService>();
builder.Services.AddScoped<IRolService, RolService>();
builder.Services.AddScoped<IEmergenciaService, EmergenciaService>();
builder.Services.AddScoped<IInventarioService, InventarioService>();

// Dapper: mapear columnas snake_case (servicio_id) a propiedades PascalCase (ServicioId)
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

// 1.2 Manejo unificado de errores: no responder automáticamente 400 ante
//     ModelState inválido (los controllers devuelven ApiResponse estandarizado).
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

// 2. Configurar Autenticación JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ClaveSecretaSuperSeguraDe32Caracteres!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

// 3. Controladores y Swagger
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. Política CORS (AllowAll para desarrollo)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configuración de zona horaria PostgreSQL para evitar choques con TIMESTAMP WITH TIME ZONE
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

// Importante: Authentication SIEMPRE va antes de Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();