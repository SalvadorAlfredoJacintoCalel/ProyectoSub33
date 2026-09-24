using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Models;
using Backend_Sub33.Models.Entities;

namespace Backend_Sub33.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Personal> Personal { get; set; }
    public DbSet<UsuarioRol> UsuarioRoles { get; set; }
    public DbSet<Rol> Roles { get; set; }
    public DbSet<Permiso> Permisos { get; set; }

    public DbSet<ConfiguracionListaMaestra> ConfiguracionListasMaestras { get; set; }
    public DbSet<CatCategoriaLista> CatCategoriasListas { get; set; }
    public DbSet<CatRango> CatRangos { get; set; }
    public DbSet<CatTipoEmergencia> CatTiposEmergencia { get; set; }
    public DbSet<CatHospital> CatHospitales { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // CatCategoriaLista
        modelBuilder.Entity<CatCategoriaLista>(entity =>
        {
            entity.ToTable("cat_categorias_listas");
            entity.HasKey(e => e.CategoriaId);
            entity.Property(e => e.CategoriaId).HasColumnName("categoria_id").ValueGeneratedOnAdd();
            entity.Property(e => e.Codigo).HasColumnName("codigo").IsRequired().HasMaxLength(50);
            entity.Property(e => e.Nombre).HasColumnName("nombre").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Modulo).HasColumnName("modulo").HasMaxLength(50).HasDefaultValue("GENERAL");
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => e.Codigo).IsUnique();
        });

        // ConfiguracionListaMaestra
        modelBuilder.Entity<ConfiguracionListaMaestra>(entity =>
        {
            entity.ToTable("configuracion_listas_maestras");
            entity.HasKey(e => e.ListaId);
            entity.Property(e => e.ListaId).HasColumnName("lista_id").ValueGeneratedOnAdd();
            entity.Property(e => e.CategoriaId).HasColumnName("categoria_id").IsRequired();
            entity.Property(e => e.Opcion).HasColumnName("opcion").IsRequired().HasMaxLength(150);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => new { e.CategoriaId, e.Opcion })
                  .IsUnique()
                  .HasDatabaseName("uk_categoria_opcion");

            entity.HasOne(e => e.Categoria)
                  .WithMany(c => c.Opciones)
                  .HasForeignKey(e => e.CategoriaId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .HasConstraintName("fk_configuracion_listas_maestras_categoria");
        });

        // CatRango
        modelBuilder.Entity<CatRango>(entity =>
        {
            entity.ToTable("cat_rangos");
            entity.HasKey(e => e.RangoId);
            entity.Property(e => e.RangoId).HasColumnName("rango_id").ValueGeneratedOnAdd();
            entity.Property(e => e.Rango).HasColumnName("rango").IsRequired().HasMaxLength(50);
            entity.Property(e => e.Minimo).HasColumnName("minimo");
            entity.Property(e => e.Maximo).HasColumnName("maximo");
        });

        // CatTipoEmergencia
        modelBuilder.Entity<CatTipoEmergencia>(entity =>
        {
            entity.ToTable("cat_tipos_emergencia");
            entity.HasKey(e => e.TipoEmergenciaId);
            entity.Property(e => e.TipoEmergenciaId).HasColumnName("tipo_emergencia_id").ValueGeneratedOnAdd();
            entity.Property(e => e.Nombre).HasColumnName("nombre").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(200);
        });

        // CatHospital
        modelBuilder.Entity<CatHospital>(entity =>
        {
            entity.ToTable("cat_hospitales");
            entity.HasKey(e => e.HospitalId);
            entity.Property(e => e.HospitalId).HasColumnName("hospital_id").ValueGeneratedOnAdd();
            entity.Property(e => e.Nombre).HasColumnName("nombre").IsRequired().HasMaxLength(150);
            entity.Property(e => e.Direccion).HasColumnName("direccion").HasMaxLength(200);
            entity.Property(e => e.Ciudad).HasColumnName("ciudad").HasMaxLength(100);
            entity.Property(e => e.CodigoPostal).HasColumnName("codigo_postal").HasMaxLength(20);
        });

        // Personal
        modelBuilder.Entity<Personal>(entity =>
        {
            entity.ToTable("personal");
            entity.HasKey(e => e.PersonalId);
            entity.Property(e => e.PersonalId).HasColumnName("personal_id").HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.PrimerNombre).HasColumnName("primer_nombre").IsRequired().HasMaxLength(100);
            entity.Property(e => e.SegundoNombre).HasColumnName("segundo_nombre").HasMaxLength(100);
            entity.Property(e => e.PrimerApellido).HasColumnName("primer_apellido").IsRequired().HasMaxLength(100);
            entity.Property(e => e.SegundoApellido).HasColumnName("segundo_apellido").HasMaxLength(100);
            entity.Property(e => e.Dpi).HasColumnName("dpi").IsRequired().HasMaxLength(20);
            entity.Property(e => e.FechaNacimiento).HasColumnName("fecha_nacimiento").HasColumnType("date");
            entity.Property(e => e.RangoId).HasColumnName("rango_id");
            entity.Property(e => e.FechaIngreso).HasColumnName("fecha_ingreso").HasColumnType("date");
            entity.Property(e => e.Telefono).HasColumnName("telefono").HasMaxLength(20);
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue(true);
            entity.Property(e => e.ContactoEmergenciaNombre).HasColumnName("contacto_emergencia_nombre").HasMaxLength(150);
            entity.Property(e => e.ContactoEmergenciaTelefono).HasColumnName("contacto_emergencia_telefono").HasMaxLength(20);

            entity.HasIndex(e => e.Dpi).IsUnique();
            
            entity.HasOne(e => e.Rango)
                  .WithMany()
                  .HasForeignKey(e => e.RangoId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .HasConstraintName("fk_personal_rango");
        });

        // Usuario
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("usuarios");
            entity.HasKey(e => e.UsuarioId);
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id").HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.PersonalId).HasColumnName("personal_id").HasColumnType("uuid");
            entity.Property(e => e.Username).HasColumnName("username").IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").IsRequired().HasMaxLength(255);
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue(true);
            entity.Property(e => e.UltimoLogin).HasColumnName("ultimo_login").HasColumnType("timestamp with time zone");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => e.Username).IsUnique();

            entity.HasOne(e => e.Personal)
                  .WithMany()
                  .HasForeignKey(e => e.PersonalId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .HasConstraintName("fk_usuario_personal");
        });

        // Rol
        modelBuilder.Entity<Rol>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(e => e.RolId);
            entity.Property(e => e.RolId).HasColumnName("rol_id").HasMaxLength(50);
            entity.Property(e => e.Nombre).HasColumnName("nombre").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
        });

        // Permiso
        modelBuilder.Entity<Permiso>(entity =>
        {
            entity.ToTable("permisos");
            entity.HasKey(e => e.PermisoId);
            entity.Property(e => e.PermisoId).HasColumnName("permiso_id").HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Codigo).HasColumnName("codigo").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
        });

        // UsuarioRol (Many-to-Many)
        modelBuilder.Entity<UsuarioRol>(entity =>
        {
            entity.ToTable("usuario_roles");
            entity.HasKey(ur => new { ur.UsuarioId, ur.RolId });
            entity.Property(ur => ur.UsuarioId).HasColumnName("usuario_id").HasColumnType("uuid");
            entity.Property(ur => ur.RolId).HasColumnName("rol_id").HasMaxLength(50);

            entity.HasOne(ur => ur.Usuario)
                  .WithMany(u => u.UsuarioRoles)
                  .HasForeignKey(ur => ur.UsuarioId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .HasConstraintName("fk_usuario_rol_usuario");

            entity.HasOne(ur => ur.Rol)
                  .WithMany(r => r.UsuarioRoles)
                  .HasForeignKey(ur => ur.RolId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .HasConstraintName("fk_usuario_rol_rol");
        });

        // RolPermiso (Many-to-Many)
        modelBuilder.Entity<RolPermiso>(entity =>
        {
            entity.ToTable("rol_permisos");
            entity.HasKey(rp => new { rp.RolId, rp.PermisoId });
            entity.Property(rp => rp.RolId).HasColumnName("rol_id").HasMaxLength(50);
            entity.Property(rp => rp.PermisoId).HasColumnName("permiso_id").HasColumnType("uuid");

            entity.HasOne(rp => rp.Rol)
                  .WithMany(r => r.RolPermisos)
                  .HasForeignKey(rp => rp.RolId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .HasConstraintName("fk_rol_permiso_rol");

            entity.HasOne(rp => rp.Permiso)
                  .WithMany(p => p.RolPermisos)
                  .HasForeignKey(rp => rp.PermisoId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .HasConstraintName("fk_rol_permiso_permiso");
        });
    }
}