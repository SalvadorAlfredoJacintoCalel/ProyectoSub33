using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend_Sub33.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cat_hospitales",
                columns: table => new
                {
                    hospital_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    direccion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ciudad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    codigo_postal = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cat_hospitales", x => x.hospital_id);
                });

            migrationBuilder.CreateTable(
                name: "cat_rangos",
                columns: table => new
                {
                    rango_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    rango = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    minimo = table.Column<int>(type: "integer", nullable: false),
                    maximo = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cat_rangos", x => x.rango_id);
                });

            migrationBuilder.CreateTable(
                name: "cat_tipos_emergencia",
                columns: table => new
                {
                    tipo_emergencia_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cat_tipos_emergencia", x => x.tipo_emergencia_id);
                });

            migrationBuilder.CreateTable(
                name: "configuracion_listas_maestras",
                columns: table => new
                {
                    lista_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    categoria = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    opcion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_configuracion_listas_maestras", x => x.lista_id);
                });

            migrationBuilder.CreateTable(
                name: "permisos",
                columns: table => new
                {
                    permiso_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    codigo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    descripcion = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permisos", x => x.permiso_id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    rol_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    descripcion = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.rol_id);
                });

            migrationBuilder.CreateTable(
                name: "personal",
                columns: table => new
                {
                    personal_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    primer_nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    segundo_nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    primer_apellido = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    segundo_apellido = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    dpi = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    fecha_nacimiento = table.Column<DateTime>(type: "date", nullable: true),
                    rango_id = table.Column<int>(type: "integer", nullable: true),
                    fecha_ingreso = table.Column<DateTime>(type: "date", nullable: false),
                    telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    estado = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    contacto_emergencia_nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    contacto_emergencia_telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_personal", x => x.personal_id);
                    table.ForeignKey(
                        name: "fk_personal_rango",
                        column: x => x.rango_id,
                        principalTable: "cat_rangos",
                        principalColumn: "rango_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "rol_permisos",
                columns: table => new
                {
                    rol_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    permiso_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rol_permisos", x => new { x.rol_id, x.permiso_id });
                    table.ForeignKey(
                        name: "fk_rol_permiso_permiso",
                        column: x => x.permiso_id,
                        principalTable: "permisos",
                        principalColumn: "permiso_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_rol_permiso_rol",
                        column: x => x.rol_id,
                        principalTable: "roles",
                        principalColumn: "rol_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    personal_id = table.Column<Guid>(type: "uuid", nullable: true),
                    username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    estado = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ultimo_login = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.usuario_id);
                    table.ForeignKey(
                        name: "fk_usuario_personal",
                        column: x => x.personal_id,
                        principalTable: "personal",
                        principalColumn: "personal_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "usuario_roles",
                columns: table => new
                {
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    rol_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuario_roles", x => new { x.usuario_id, x.rol_id });
                    table.ForeignKey(
                        name: "fk_usuario_rol_rol",
                        column: x => x.rol_id,
                        principalTable: "roles",
                        principalColumn: "rol_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_usuario_rol_usuario",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "usuario_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_configuracion_listas_maestras_categoria_opcion",
                table: "configuracion_listas_maestras",
                columns: new[] { "categoria", "opcion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_personal_dpi",
                table: "personal",
                column: "dpi",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_personal_rango_id",
                table: "personal",
                column: "rango_id");

            migrationBuilder.CreateIndex(
                name: "IX_rol_permisos_permiso_id",
                table: "rol_permisos",
                column: "permiso_id");

            migrationBuilder.CreateIndex(
                name: "IX_usuario_roles_rol_id",
                table: "usuario_roles",
                column: "rol_id");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_personal_id",
                table: "usuarios",
                column: "personal_id");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_username",
                table: "usuarios",
                column: "username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cat_hospitales");

            migrationBuilder.DropTable(
                name: "cat_tipos_emergencia");

            migrationBuilder.DropTable(
                name: "configuracion_listas_maestras");

            migrationBuilder.DropTable(
                name: "rol_permisos");

            migrationBuilder.DropTable(
                name: "usuario_roles");

            migrationBuilder.DropTable(
                name: "permisos");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "personal");

            migrationBuilder.DropTable(
                name: "cat_rangos");
        }
    }
}
