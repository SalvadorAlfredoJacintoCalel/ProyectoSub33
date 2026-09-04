using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Models;

namespace Backend_Sub33.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Usuario>(entity =>
        {
            // ... configuración existente de Usuario
        });

        modelBuilder.Entity<RolPermiso>(entity =>
        {
            entity.HasKey(rp => new { rp.RolId, rp.PermisoId });
        });

        modelBuilder.Entity<UsuarioRol>(entity =>
        {
            entity.HasKey(ur => new { ur.UsuarioId, ur.RolId });
        });

        modelBuilder.Entity<Permiso>(entity =>
        {
            entity.ToTable("permisos");

            entity.HasKey(e => e.PermisoId);

            entity.Property(e => e.PermisoId).HasColumnName("permiso_id").HasColumnType("uuid");

            entity.Property(e => e.Codigo).HasColumnName("codigo");
        });
    }
}