using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend_Sub33.Migrations
{
    /// <inheritdoc />
    public partial class CreateMissingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cat_tipos_unidad",
                columns: table => new
                {
                    tipo_unidad_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cat_tipos_unidad", x => x.tipo_unidad_id);
                    table.UniqueConstraint("UX_cat_tipos_unidad_nombre", x => x.nombre);
                });

            migrationBuilder.CreateTable(
                name: "cat_unidades",
                columns: table => new
                {
                    unidad_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    codigo_unidad = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    tipo_unidad_id = table.Column<int>(type: "integer", nullable: false),
                    placa = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    estado = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Disponible"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cat_unidades", x => x.unidad_id);
                    table.UniqueConstraint("UX_cat_unidades_codigo_unidad", x => x.codigo_unidad);
                    table.ForeignKey(
                        name: "FK_cat_unidades_cat_tipos_unidad_tipo_unidad_id",
                        column: x => x.tipo_unidad_id,
                        principalTable: "cat_tipos_unidad",
                        principalColumn: "tipo_unidad_id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cat_unidades_cat_tipos_unidad_tipo_unidad_id",
                table: "cat_unidades");

            migrationBuilder.DropTable(
                name: "cat_unidades");

            migrationBuilder.DropTable(
                name: "cat_tipos_unidad");
        }
    }
}