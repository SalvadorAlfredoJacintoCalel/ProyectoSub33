using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Dapper;
using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Donacion;

namespace Backend_Sub33.Services
{
    public class DonacionService : IDonacionService
    {
        private readonly AppDbContext _context;

        public DonacionService(AppDbContext context)
        {
            _context = context;
        }

        private System.Data.Common.DbConnection AbrirConexion()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open)
            {
                connection.Open();
            }
            return connection;
        }

        private const string DonacionSelect = @"
            SELECT donacion_id,
                   fecha,
                   no_recibo,
                   donante,
                   dpi_nit,
                   telefono,
                   tipo,
                   categoria,
                   descripcion,
                   monto,
                   estado,
                   metodo_pago,
                   no_comprobante,
                   created_at,
                   updated_at
            FROM donaciones";

        private static async Task<List<MaterialDonacionDto>> CargarMaterialesAsync(
            System.Data.Common.DbConnection connection, int donacionId, System.Data.Common.DbTransaction? transaction = null)
        {
            var sql = "SELECT material_id, donacion_id, descripcion, cantidad, valor_estimado, categoria FROM materiales_donacion WHERE donacion_id = @Id ORDER BY material_id";
            var items = await connection.QueryAsync<MaterialDonacionDto>(sql, new { Id = donacionId }, transaction);
            return items.ToList();
        }

        private static string MapearCategoria(string? categoria)
        {
            return categoria switch
            {
                "Insumos Médicos" => "Medicamentos",
                "Equipo/Herramientas" => "Rescate",
                _ => "Otros Insumos"
            };
        }

        private static async Task<int> ResolverCategoriaInvIdAsync(
            System.Data.Common.DbConnection connection, System.Data.Common.DbTransaction transaction, string? categoria)
        {
            var nombre = MapearCategoria(categoria);

            var id = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = @Nombre LIMIT 1",
                new { Nombre = nombre }, transaction);

            if (!id.HasValue)
            {
                id = await connection.QueryFirstOrDefaultAsync<int?>(
                    "SELECT categoria_inv_id FROM cat_categorias_inventario ORDER BY categoria_inv_id LIMIT 1",
                    transaction: transaction);
            }

            return id ?? 0;
        }

        private async Task SincronizarInventarioAsync(
            System.Data.Common.DbConnection connection, System.Data.Common.DbTransaction transaction,
            int donacionId, string noRecibo, string donante, string? categoria, IEnumerable<MaterialDonacionCreateDto> materiales)
        {
            var tipoEntrada = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT tipo_mov_id FROM cat_tipos_movimiento WHERE codigo = 'ENTRADA' LIMIT 1",
                transaction: transaction);

            foreach (var m in materiales)
            {
                if (string.IsNullOrWhiteSpace(m.Descripcion))
                {
                    continue;
                }

                var cat = string.IsNullOrWhiteSpace(m.Categoria) ? categoria : m.Categoria;
                if (cat == "Vehículos")
                {
                    continue; // FASE 2
                }

                var categoriaInvId = await ResolverCategoriaInvIdAsync(connection, transaction, cat);

                var itemId = await connection.QueryFirstOrDefaultAsync<int?>(
                    "SELECT item_id FROM inventario_items WHERE nombre = @Nombre LIMIT 1",
                    new { Nombre = m.Descripcion.Trim() }, transaction);

                if (itemId.HasValue)
                {
                    await connection.ExecuteAsync(@"
                        UPDATE inventario_items SET
                            stock_actual = stock_actual + @Cantidad,
                            origen = 'Donado',
                            donacion_id = @DonacionId,
                            nombre_donante = @Donante,
                            no_recibo = @NoRecibo
                        WHERE item_id = @ItemId",
                        new { ItemId = itemId.Value, Cantidad = m.Cantidad, DonacionId = donacionId, Donante = donante, NoRecibo = noRecibo },
                        transaction);
                }
                else
                {
                    itemId = await connection.QuerySingleAsync<int>(@"
                        INSERT INTO inventario_items (categoria_inv_id, nombre, stock_actual, stock_minimo, unidad_medida, origen, donacion_id, nombre_donante, no_recibo)
                        VALUES (@CategoriaInvId, @Nombre, @Cantidad, 0, 'Unidad', 'Donado', @DonacionId, @Donante, @NoRecibo)
                        RETURNING item_id;",
                        new { CategoriaInvId = categoriaInvId, Nombre = m.Descripcion.Trim(), Cantidad = m.Cantidad, DonacionId = donacionId, Donante = donante, NoRecibo = noRecibo },
                        transaction);
                }

                if (tipoEntrada.HasValue)
                {
                    await connection.ExecuteAsync(@"
                        INSERT INTO inventario_movimientos (item_id, tipo_mov_id, cantidad, motivo, fecha_hora)
                        VALUES (@ItemId, @TipoMovId, @Cantidad, @Motivo, CURRENT_TIMESTAMP);",
                        new { ItemId = itemId.Value, TipoMovId = tipoEntrada.Value, Cantidad = m.Cantidad, Motivo = $"Donación {noRecibo}" },
                        transaction);
                }
            }
        }

        public async Task<ServiceResult<DonacionListResponseDto>> GetPaginadoAsync(DonacionFiltrosDto filtros)
        {
            try
            {
                using var connection = AbrirConexion();

                var where = new List<string> { "1=1" };
                var parameters = new DynamicParameters();

                if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
                {
                    where.Add("(donante ILIKE @Busqueda OR no_recibo ILIKE @Busqueda OR descripcion ILIKE @Busqueda)");
                    parameters.Add("Busqueda", $"%{filtros.Busqueda}%");
                }

                if (!string.IsNullOrWhiteSpace(filtros.Tipo))
                {
                    where.Add("tipo = @Tipo");
                    parameters.Add("Tipo", filtros.Tipo);
                }

                if (!string.IsNullOrWhiteSpace(filtros.Categoria))
                {
                    where.Add("categoria = @Categoria");
                    parameters.Add("Categoria", filtros.Categoria);
                }

                if (!string.IsNullOrWhiteSpace(filtros.Estado))
                {
                    where.Add("estado = @Estado");
                    parameters.Add("Estado", filtros.Estado);
                }

                var whereClause = string.Join(" AND ", where);

                var total = await connection.ExecuteScalarAsync<int>(
                    $"SELECT COUNT(*) FROM donaciones WHERE {whereClause}", parameters);

                var pagina = Math.Max(1, filtros.Pagina);
                var tamanio = Math.Clamp(filtros.TamanoPagina, 1, 100);
                var offset = (pagina - 1) * tamanio;

                var sql = $"{DonacionSelect} WHERE {whereClause} ORDER BY donacion_id DESC LIMIT @Tamano OFFSET @Offset";
                parameters.Add("Tamano", tamanio);
                parameters.Add("Offset", offset);

                var items = (await connection.QueryAsync<DonacionDto>(sql, parameters)).ToList();

                foreach (var d in items)
                {
                    d.Materiales = await CargarMaterialesAsync(connection, d.DonacionId);
                }

                var resultado = new DonacionListResponseDto
                {
                    Items = items,
                    TotalItems = total,
                    PaginaActual = pagina,
                    TamanoPagina = tamanio,
                    TotalPaginas = (int)Math.Ceiling(total / (double)tamanio)
                };

                return ServiceResult<DonacionListResponseDto>.Success(resultado);
            }
            catch (Exception ex)
            {
                return ServiceResult<DonacionListResponseDto>.Internal($"Error al obtener donaciones: {ex.Message}");
            }
        }

        public async Task<ServiceResult<DonacionDto>> GetByIdAsync(int id)
        {
            try
            {
                using var connection = AbrirConexion();
                var donacion = await connection.QueryFirstOrDefaultAsync<DonacionDto>(
                    $"{DonacionSelect} WHERE donacion_id = @Id", new { Id = id });

                if (donacion == null)
                {
                    return ServiceResult<DonacionDto>.NotFound("Donación no encontrada.");
                }

                donacion.Materiales = await CargarMaterialesAsync(connection, id);
                return ServiceResult<DonacionDto>.Success(donacion);
            }
            catch (Exception ex)
            {
                return ServiceResult<DonacionDto>.Internal($"Error al obtener donación: {ex.Message}");
            }
        }

        public async Task<ServiceResult<DonacionDto>> CreateAsync(DonacionCreateDto dto)
        {
            using var connection = AbrirConexion();
            using var transaction = connection.BeginTransaction();

            try
            {
                var donante = dto.Donante?.Trim();
                if (string.IsNullOrWhiteSpace(donante))
                {
                    return ServiceResult<DonacionDto>.BadRequest("El donante es obligatorio.");
                }

                var noRecibo = string.IsNullOrWhiteSpace(dto.NoRecibo) ? $"REC-{DateTime.Now:yyyy}-{DateTime.Now:MMddHHmm}" : dto.NoRecibo.Trim();

                var reciboDuplicado = await connection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM donaciones WHERE no_recibo = @NoRecibo)",
                    new { NoRecibo = noRecibo }, transaction);
                if (reciboDuplicado)
                {
                    return ServiceResult<DonacionDto>.Conflict("El número de recibo ya existe.");
                }

                var donacionId = await connection.QuerySingleAsync<int>(@"
                    INSERT INTO donaciones (fecha, no_recibo, donante, dpi_nit, telefono, tipo, categoria, descripcion, monto, estado, metodo_pago, no_comprobante, created_at, updated_at)
                    VALUES (COALESCE(@Fecha, CURRENT_DATE), @NoRecibo, @Donante, @DpiNit, @Telefono, @Tipo, @Categoria, @Descripcion, @Monto, @Estado, @MetodoPago, @NoComprobante, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING donacion_id;",
                    new
                    {
                        Fecha = dto.Fecha,
                        NoRecibo = noRecibo,
                        Donante = donante,
                        DpiNit = dto.DpiNit,
                        Telefono = dto.Telefono,
                        Tipo = dto.Tipo,
                        Categoria = dto.Tipo == "Monetaria" ? "Efectivo" : dto.Categoria,
                        Descripcion = dto.Descripcion,
                        Monto = dto.Monto,
                        Estado = string.IsNullOrWhiteSpace(dto.Estado) ? "Pendiente" : dto.Estado,
                        MetodoPago = dto.MetodoPago,
                        NoComprobante = dto.NoComprobante
                    }, transaction);

                if (dto.Tipo == "Material" && dto.Materiales != null && dto.Materiales.Any())
                {
                    foreach (var m in dto.Materiales)
                    {
                        await connection.ExecuteAsync(@"
                            INSERT INTO materiales_donacion (donacion_id, descripcion, cantidad, valor_estimado, categoria)
                            VALUES (@DonacionId, @Descripcion, @Cantidad, @ValorEstimado, @Categoria);",
                            new { DonacionId = donacionId, Descripcion = m.Descripcion, Cantidad = m.Cantidad, ValorEstimado = m.ValorEstimado, Categoria = m.Categoria ?? dto.Categoria },
                            transaction);
                    }

                    await SincronizarInventarioAsync(connection, transaction, donacionId, noRecibo, donante, dto.Categoria, dto.Materiales);
                }

                transaction.Commit();

                return await GetByIdAsync(donacionId);
            }
            catch (Exception ex)
            {
                try { transaction.Rollback(); } catch { }
                return ServiceResult<DonacionDto>.Internal($"Error al registrar donación: {ex.Message}");
            }
        }

        public async Task<ServiceResult<DonacionDto>> UpdateAsync(int id, DonacionUpdateDto dto)
        {
            using var connection = AbrirConexion();

            var existe = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM donaciones WHERE donacion_id = @Id", new { Id = id });
            if (existe == 0)
            {
                return ServiceResult<DonacionDto>.NotFound("Donación no encontrada.");
            }

            using var transaction = connection.BeginTransaction();

            try
            {
                var donante = dto.Donante?.Trim();
                if (string.IsNullOrWhiteSpace(donante))
                {
                    return ServiceResult<DonacionDto>.BadRequest("El donante es obligatorio.");
                }

                var noRecibo = string.IsNullOrWhiteSpace(dto.NoRecibo) ? $"REC-{DateTime.Now:yyyy}-{DateTime.Now:MMddHHmm}" : dto.NoRecibo.Trim();

                var reciboDuplicado = await connection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM donaciones WHERE no_recibo = @NoRecibo AND donacion_id <> @Id)",
                    new { NoRecibo = noRecibo, Id = id }, transaction);
                if (reciboDuplicado)
                {
                    return ServiceResult<DonacionDto>.Conflict("El número de recibo ya existe.");
                }

                await connection.ExecuteAsync(@"
                    UPDATE donaciones SET
                        fecha = COALESCE(@Fecha, fecha),
                        no_recibo = @NoRecibo,
                        donante = @Donante,
                        dpi_nit = @DpiNit,
                        telefono = @Telefono,
                        tipo = @Tipo,
                        categoria = @Categoria,
                        descripcion = @Descripcion,
                        monto = @Monto,
                        estado = @Estado,
                        metodo_pago = @MetodoPago,
                        no_comprobante = @NoComprobante,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE donacion_id = @Id",
                    new
                    {
                        Id = id,
                        Fecha = dto.Fecha,
                        NoRecibo = noRecibo,
                        Donante = donante,
                        DpiNit = dto.DpiNit,
                        Telefono = dto.Telefono,
                        Tipo = dto.Tipo,
                        Categoria = dto.Tipo == "Monetaria" ? "Efectivo" : dto.Categoria,
                        Descripcion = dto.Descripcion,
                        Monto = dto.Monto,
                        Estado = string.IsNullOrWhiteSpace(dto.Estado) ? "Pendiente" : dto.Estado,
                        MetodoPago = dto.MetodoPago,
                        NoComprobante = dto.NoComprobante
                    }, transaction);

                // Reemplazar materiales (solo para Material)
                await connection.ExecuteAsync(
                    "DELETE FROM materiales_donacion WHERE donacion_id = @Id", new { Id = id }, transaction);

                if (dto.Tipo == "Material" && dto.Materiales != null && dto.Materiales.Any())
                {
                    foreach (var m in dto.Materiales)
                    {
                        await connection.ExecuteAsync(@"
                            INSERT INTO materiales_donacion (donacion_id, descripcion, cantidad, valor_estimado, categoria)
                            VALUES (@DonacionId, @Descripcion, @Cantidad, @ValorEstimado, @Categoria);",
                            new { DonacionId = id, Descripcion = m.Descripcion, Cantidad = m.Cantidad, ValorEstimado = m.ValorEstimado, Categoria = m.Categoria ?? dto.Categoria },
                            transaction);
                    }
                }

                transaction.Commit();

                return await GetByIdAsync(id);
            }
            catch (Exception ex)
            {
                try { transaction.Rollback(); } catch { }
                return ServiceResult<DonacionDto>.Internal($"Error al actualizar donación: {ex.Message}");
            }
        }

        public async Task<ServiceResult> ChangeEstadoAsync(int id, string estado)
        {
            try
            {
                using var connection = AbrirConexion();

                var existe = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM donaciones WHERE donacion_id = @Id", new { Id = id });
                if (existe == 0)
                {
                    return ServiceResult.NotFound("Donación no encontrada.");
                }

                await connection.ExecuteAsync(
                    "UPDATE donaciones SET estado = @Estado, updated_at = CURRENT_TIMESTAMP WHERE donacion_id = @Id",
                    new { Id = id, Estado = estado });

                return ServiceResult.Success();
            }
            catch (Exception ex)
            {
                return ServiceResult.Internal($"Error al cambiar estado: {ex.Message}");
            }
        }

        public async Task<ServiceResult> DeleteAsync(int id)
        {
            try
            {
                using var connection = AbrirConexion();

                var existe = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM donaciones WHERE donacion_id = @Id", new { Id = id });
                if (existe == 0)
                {
                    return ServiceResult.NotFound("Donación no encontrada.");
                }

                await connection.ExecuteAsync(
                    "UPDATE inventario_items SET donacion_id = NULL WHERE donacion_id = @Id", new { Id = id });
                await connection.ExecuteAsync(
                    "DELETE FROM donaciones WHERE donacion_id = @Id", new { Id = id });

                return ServiceResult.Success();
            }
            catch (Exception ex)
            {
                return ServiceResult.Internal($"Error al eliminar donación: {ex.Message}");
            }
        }
    }
}
