using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Dapper;
using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Inventario;

namespace Backend_Sub33.Services
{
    public class InventarioService : IInventarioService
    {
        private readonly AppDbContext _context;

        public InventarioService(AppDbContext context)
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

        private const string ItemSelect = @"
            SELECT i.item_id,
                   i.categoria_inv_id,
                   COALESCE(c.nombre, '') AS categoria_nombre,
                   i.proveedor_id,
                   p.nombre_empresa AS proveedor_nombre,
                   i.codigo_barras,
                   i.nombre,
                   i.stock_actual,
                   i.stock_minimo,
                   COALESCE(i.unidad_medida, '') AS unidad_medida,
                   i.created_at
            FROM inventario_items i
            LEFT JOIN cat_categorias_inventario c ON c.categoria_inv_id = i.categoria_inv_id
            LEFT JOIN cat_proveedores p ON p.proveedor_id = i.proveedor_id";

        // ── Items ─────────────────────────────────────────────────────────────

        public async Task<ServiceResult<PaginatedResult<InventarioItemDto>>> GetItemsAsync(InventarioItemFiltrosDto filtros)
        {
            try
            {
                using var connection = AbrirConexion();

                var where = new List<string> { "1=1" };
                var parameters = new DynamicParameters();

                if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
                {
                    where.Add("(i.nombre ILIKE @Busqueda OR i.codigo_barras ILIKE @Busqueda)");
                    parameters.Add("Busqueda", $"%{filtros.Busqueda}%");
                }

                if (filtros.CategoriaInvId.HasValue)
                {
                    where.Add("i.categoria_inv_id = @CategoriaInvId");
                    parameters.Add("CategoriaInvId", filtros.CategoriaInvId.Value);
                }

                var whereClause = string.Join(" AND ", where);

                var total = await connection.ExecuteScalarAsync<int>(
                    $"SELECT COUNT(*) FROM inventario_items i WHERE {whereClause}", parameters);

                var pagina = Math.Max(1, filtros.Pagina);
                var tamanio = Math.Clamp(filtros.TamanoPagina, 1, 100);
                var offset = (pagina - 1) * tamanio;

                var sql = $"{ItemSelect} WHERE {whereClause} ORDER BY i.item_id DESC LIMIT @Tamano OFFSET @Offset";
                parameters.Add("Tamano", tamanio);
                parameters.Add("Offset", offset);

                var items = (await connection.QueryAsync<InventarioItemDto>(sql, parameters)).ToList();

                var resultado = new PaginatedResult<InventarioItemDto>
                {
                    Pagina = pagina,
                    Tamanio = tamanio,
                    Total = total,
                    TotalPaginas = (int)Math.Ceiling(total / (double)tamanio),
                    Items = items
                };

                return ServiceResult<PaginatedResult<InventarioItemDto>>.Success(resultado);
            }
            catch (Exception ex)
            {
                return ServiceResult<PaginatedResult<InventarioItemDto>>.Internal($"Error al obtener items: {ex.Message}");
            }
        }

        public async Task<ServiceResult<InventarioItemDto>> GetItemByIdAsync(int id)
        {
            try
            {
                using var connection = AbrirConexion();
                var item = await connection.QueryFirstOrDefaultAsync<InventarioItemDto>(
                    $"{ItemSelect} WHERE i.item_id = @Id", new { Id = id });

                if (item == null)
                {
                    return ServiceResult<InventarioItemDto>.NotFound("Item no encontrado.");
                }

                return ServiceResult<InventarioItemDto>.Success(item);
            }
            catch (Exception ex)
            {
                return ServiceResult<InventarioItemDto>.Internal($"Error al obtener item: {ex.Message}");
            }
        }

        public async Task<ServiceResult<InventarioItemDto>> CreateItemAsync(InventarioItemCreateDto dto)
        {
            try
            {
                var nombre = dto.Nombre?.Trim();
                if (string.IsNullOrWhiteSpace(nombre))
                {
                    return ServiceResult<InventarioItemDto>.BadRequest("El nombre es obligatorio.");
                }

                using var connection = AbrirConexion();

                var categoriaExiste = await connection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM cat_categorias_inventario WHERE categoria_inv_id = @Id)",
                    new { Id = dto.CategoriaInvId });
                if (!categoriaExiste)
                {
                    return ServiceResult<InventarioItemDto>.BadRequest("La categoría seleccionada no existe.");
                }

                if (dto.StockActual < 0 || dto.StockMinimo < 0)
                {
                    return ServiceResult<InventarioItemDto>.BadRequest("El stock no puede ser negativo.");
                }

                if (!string.IsNullOrWhiteSpace(dto.CodigoBarras))
                {
                    var codigoDuplicado = await connection.ExecuteScalarAsync<bool>(
                        "SELECT EXISTS(SELECT 1 FROM inventario_items WHERE codigo_barras = @Codigo)",
                        new { Codigo = dto.CodigoBarras.Trim() });
                    if (codigoDuplicado)
                    {
                        return ServiceResult<InventarioItemDto>.Conflict("El código de barras ya existe.");
                    }
                }

                var itemId = await connection.QuerySingleAsync<int>(@"
                    INSERT INTO inventario_items (categoria_inv_id, proveedor_id, codigo_barras, nombre, stock_actual, stock_minimo, unidad_medida, created_at)
                    VALUES (@CategoriaInvId, @ProveedorId, @CodigoBarras, @Nombre, @StockActual, @StockMinimo, @UnidadMedida, CURRENT_TIMESTAMP)
                    RETURNING item_id;",
                    new
                    {
                        CategoriaInvId = dto.CategoriaInvId,
                        ProveedorId = dto.ProveedorId,
                        CodigoBarras = string.IsNullOrWhiteSpace(dto.CodigoBarras) ? null : dto.CodigoBarras.Trim(),
                        Nombre = nombre,
                        StockActual = dto.StockActual,
                        StockMinimo = dto.StockMinimo,
                        UnidadMedida = string.IsNullOrWhiteSpace(dto.UnidadMedida) ? "Unidad" : dto.UnidadMedida.Trim()
                    });

                var creado = await connection.QueryFirstOrDefaultAsync<InventarioItemDto>(
                    $"{ItemSelect} WHERE i.item_id = @Id", new { Id = itemId });

                return ServiceResult<InventarioItemDto>.Success(creado!);
            }
            catch (Exception ex)
            {
                return ServiceResult<InventarioItemDto>.Internal($"Error al crear item: {ex.Message}");
            }
        }

        public async Task<ServiceResult<InventarioItemDto>> UpdateItemAsync(int id, InventarioItemUpdateDto dto)
        {
            try
            {
                var nombre = dto.Nombre?.Trim();
                if (string.IsNullOrWhiteSpace(nombre))
                {
                    return ServiceResult<InventarioItemDto>.BadRequest("El nombre es obligatorio.");
                }

                using var connection = AbrirConexion();

                var existe = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM inventario_items WHERE item_id = @Id", new { Id = id });
                if (existe == 0)
                {
                    return ServiceResult<InventarioItemDto>.NotFound("Item no encontrado.");
                }

                if (dto.StockMinimo < 0)
                {
                    return ServiceResult<InventarioItemDto>.BadRequest("El stock mínimo no puede ser negativo.");
                }

                if (!string.IsNullOrWhiteSpace(dto.CodigoBarras))
                {
                    var codigoDuplicado = await connection.ExecuteScalarAsync<bool>(
                        "SELECT EXISTS(SELECT 1 FROM inventario_items WHERE codigo_barras = @Codigo AND item_id <> @Id)",
                        new { Codigo = dto.CodigoBarras.Trim(), Id = id });
                    if (codigoDuplicado)
                    {
                        return ServiceResult<InventarioItemDto>.Conflict("El código de barras ya existe.");
                    }
                }

                await connection.ExecuteAsync(@"
                    UPDATE inventario_items SET
                        categoria_inv_id = @CategoriaInvId,
                        proveedor_id = @ProveedorId,
                        codigo_barras = @CodigoBarras,
                        nombre = @Nombre,
                        stock_minimo = @StockMinimo,
                        unidad_medida = @UnidadMedida
                    WHERE item_id = @Id",
                    new
                    {
                        Id = id,
                        CategoriaInvId = dto.CategoriaInvId,
                        ProveedorId = dto.ProveedorId,
                        CodigoBarras = string.IsNullOrWhiteSpace(dto.CodigoBarras) ? null : dto.CodigoBarras.Trim(),
                        Nombre = nombre,
                        StockMinimo = dto.StockMinimo,
                        UnidadMedida = string.IsNullOrWhiteSpace(dto.UnidadMedida) ? "Unidad" : dto.UnidadMedida.Trim()
                    });

                var actualizado = await connection.QueryFirstOrDefaultAsync<InventarioItemDto>(
                    $"{ItemSelect} WHERE i.item_id = @Id", new { Id = id });

                return ServiceResult<InventarioItemDto>.Success(actualizado!);
            }
            catch (Exception ex)
            {
                return ServiceResult<InventarioItemDto>.Internal($"Error al actualizar item: {ex.Message}");
            }
        }

        public async Task<ServiceResult> DeleteItemAsync(int id)
        {
            try
            {
                using var connection = AbrirConexion();

                var existe = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM inventario_items WHERE item_id = @Id", new { Id = id });
                if (existe == 0)
                {
                    return ServiceResult.NotFound("Item no encontrado.");
                }

                var tieneMovimientos = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM inventario_movimientos WHERE item_id = @Id", new { Id = id });
                if (tieneMovimientos > 0)
                {
                    return ServiceResult.Conflict("No se puede eliminar el item porque tiene movimientos registrados.");
                }

                await connection.ExecuteAsync(
                    "DELETE FROM equipo_unidades WHERE item_id = @Id", new { Id = id });
                await connection.ExecuteAsync(
                    "DELETE FROM servicio_insumos_utilizados WHERE item_id = @Id", new { Id = id });
                await connection.ExecuteAsync(
                    "DELETE FROM inventario_items WHERE item_id = @Id", new { Id = id });

                return ServiceResult.Success();
            }
            catch (Exception ex)
            {
                return ServiceResult.Internal($"Error al eliminar item: {ex.Message}");
            }
        }

        // ── Movimientos ───────────────────────────────────────────────────────

        public async Task<ServiceResult<List<InventarioMovimientoDto>>> GetMovimientosAsync(int? itemId, int? tipoMovId, DateTime? desde, DateTime? hasta)
        {
            try
            {
                using var connection = AbrirConexion();

                var where = new List<string> { "1=1" };
                var parameters = new DynamicParameters();

                if (itemId.HasValue)
                {
                    where.Add("m.item_id = @ItemId");
                    parameters.Add("ItemId", itemId.Value);
                }

                if (tipoMovId.HasValue)
                {
                    where.Add("m.tipo_mov_id = @TipoMovId");
                    parameters.Add("TipoMovId", tipoMovId.Value);
                }

                if (desde.HasValue)
                {
                    where.Add("m.fecha_hora >= @Desde");
                    parameters.Add("Desde", desde.Value);
                }

                if (hasta.HasValue)
                {
                    where.Add("m.fecha_hora <= @Hasta");
                    parameters.Add("Hasta", hasta.Value);
                }

                var whereClause = string.Join(" AND ", where);

                var sql = $@"
                    SELECT m.movimiento_id,
                           m.item_id,
                           COALESCE(i.nombre, '') AS item_nombre,
                           m.tipo_mov_id,
                           COALESCE(t.descripcion, '') AS tipo_mov_nombre,
                           m.cantidad,
                           m.motivo,
                           m.responsable_id,
                           COALESCE(per.primer_nombre || ' ' || per.primer_apellido, '') AS responsable_nombre,
                           m.fecha_hora
                    FROM inventario_movimientos m
                    LEFT JOIN inventario_items i ON i.item_id = m.item_id
                    LEFT JOIN cat_tipos_movimiento t ON t.tipo_mov_id = m.tipo_mov_id
                    LEFT JOIN personal per ON per.personal_id = m.responsable_id
                    WHERE {whereClause}
                    ORDER BY m.movimiento_id DESC";

                var items = (await connection.QueryAsync<InventarioMovimientoDto>(sql, parameters)).ToList();
                return ServiceResult<List<InventarioMovimientoDto>>.Success(items);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<InventarioMovimientoDto>>.Internal($"Error al obtener movimientos: {ex.Message}");
            }
        }

        public async Task<ServiceResult<InventarioMovimientoDto>> CreateMovimientoAsync(InventarioMovimientoCreateDto dto)
        {
            using var connection = AbrirConexion();
            using var transaction = connection.BeginTransaction();

            try
            {
                if (dto.Cantidad <= 0)
                {
                    return ServiceResult<InventarioMovimientoDto>.BadRequest("La cantidad debe ser mayor a 0.");
                }

                var tipo = await connection.QueryFirstOrDefaultAsync<(string Codigo, string Descripcion)>(
                    "SELECT codigo, descripcion FROM cat_tipos_movimiento WHERE tipo_mov_id = @Id",
                    new { Id = dto.TipoMovId }, transaction);

                if (tipo == default)
                {
                    return ServiceResult<InventarioMovimientoDto>.BadRequest("El tipo de movimiento no existe.");
                }

                var item = await connection.QueryFirstOrDefaultAsync<(string Nombre, int StockActual)>(
                    "SELECT nombre, stock_actual FROM inventario_items WHERE item_id = @Id",
                    new { Id = dto.ItemId }, transaction);

                if (item == default)
                {
                    return ServiceResult<InventarioMovimientoDto>.NotFound("Item no encontrado.");
                }

                int nuevoStock;
                switch (tipo.Codigo.ToUpperInvariant())
                {
                    case "ENTRADA":
                        nuevoStock = item.StockActual + dto.Cantidad;
                        break;
                    case "SALIDA":
                    case "BAJA":
                    case "USO_SERVICIO":
                        if (item.StockActual < dto.Cantidad)
                        {
                            return ServiceResult<InventarioMovimientoDto>.BadRequest("Stock insuficiente para realizar la salida.");
                        }
                        nuevoStock = item.StockActual - dto.Cantidad;
                        break;
                    case "AJUSTE":
                        nuevoStock = dto.Cantidad;
                        break;
                    default:
                        nuevoStock = item.StockActual;
                        break;
                }

                var movimientoId = await connection.QuerySingleAsync<int>(@"
                    INSERT INTO inventario_movimientos (item_id, tipo_mov_id, cantidad, motivo, responsable_id, fecha_hora)
                    VALUES (@ItemId, @TipoMovId, @Cantidad, @Motivo, @ResponsableId, CURRENT_TIMESTAMP)
                    RETURNING movimiento_id;",
                    new
                    {
                        ItemId = dto.ItemId,
                        TipoMovId = dto.TipoMovId,
                        Cantidad = dto.Cantidad,
                        Motivo = dto.Motivo ?? string.Empty,
                        ResponsableId = dto.ResponsableId
                    }, transaction);

                await connection.ExecuteAsync(
                    "UPDATE inventario_items SET stock_actual = @Stock WHERE item_id = @Id",
                    new { Id = dto.ItemId, Stock = nuevoStock }, transaction);

                transaction.Commit();

                return ServiceResult<InventarioMovimientoDto>.Success(new InventarioMovimientoDto
                {
                    MovimientoId = movimientoId,
                    ItemId = dto.ItemId,
                    ItemNombre = item.Nombre,
                    TipoMovId = dto.TipoMovId,
                    TipoMovNombre = tipo.Descripcion,
                    Cantidad = dto.Cantidad,
                    Motivo = dto.Motivo ?? string.Empty,
                    ResponsableId = dto.ResponsableId,
                    FechaHora = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                try { transaction.Rollback(); } catch { }
                return ServiceResult<InventarioMovimientoDto>.Internal($"Error al registrar movimiento: {ex.Message}");
            }
        }

        // ── Equipo-Unidades ───────────────────────────────────────────────────

        public async Task<ServiceResult<List<EquipoUnidadDto>>> GetEquipoUnidadesAsync(int? unidadId)
        {
            try
            {
                using var connection = AbrirConexion();

                var where = "1=1";
                var parameters = new DynamicParameters();
                if (unidadId.HasValue)
                {
                    where = "e.unidad_id = @UnidadId";
                    parameters.Add("UnidadId", unidadId.Value);
                }

                var sql = $@"
                    SELECT e.unidad_id,
                           COALESCE(u.codigo_unidad, '') AS unidad_codigo,
                           e.item_id,
                           COALESCE(i.nombre, '') AS item_nombre,
                           e.cantidad_asignada
                    FROM equipo_unidades e
                    LEFT JOIN cat_unidades u ON u.unidad_id = e.unidad_id
                    LEFT JOIN inventario_items i ON i.item_id = e.item_id
                    WHERE {where}
                    ORDER BY e.unidad_id, e.item_id";

                var items = (await connection.QueryAsync<EquipoUnidadDto>(sql, parameters)).ToList();
                return ServiceResult<List<EquipoUnidadDto>>.Success(items);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<EquipoUnidadDto>>.Internal($"Error al obtener equipo por unidad: {ex.Message}");
            }
        }

        public async Task<ServiceResult> AsignarEquipoAsync(EquipoUnidadCreateDto dto)
        {
            try
            {
                if (dto.CantidadAsignada <= 0)
                {
                    return ServiceResult.BadRequest("La cantidad asignada debe ser mayor a 0.");
                }

                using var connection = AbrirConexion();

                var itemExiste = await connection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM inventario_items WHERE item_id = @Id)", new { Id = dto.ItemId });
                if (!itemExiste)
                {
                    return ServiceResult.BadRequest("El item no existe.");
                }

                var unidadExiste = await connection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM cat_unidades WHERE unidad_id = @Id)", new { Id = dto.UnidadId });
                if (!unidadExiste)
                {
                    return ServiceResult.BadRequest("La unidad no existe.");
                }

                await connection.ExecuteAsync(@"
                    INSERT INTO equipo_unidades (unidad_id, item_id, cantidad_asignada)
                    VALUES (@UnidadId, @ItemId, @CantidadAsignada)
                    ON CONFLICT (unidad_id, item_id) DO UPDATE SET cantidad_asignada = EXCLUDED.cantidad_asignada;",
                    new { UnidadId = dto.UnidadId, ItemId = dto.ItemId, CantidadAsignada = dto.CantidadAsignada });

                return ServiceResult.Success();
            }
            catch (Exception ex)
            {
                return ServiceResult.Internal($"Error al asignar equipo: {ex.Message}");
            }
        }

        // ── Servicio-Insumos ──────────────────────────────────────────────────

        public async Task<ServiceResult<List<ServicioInsumoUtilizadoDto>>> GetInsumosUtilizadosAsync(int? servicioId)
        {
            try
            {
                using var connection = AbrirConexion();

                var where = "1=1";
                var parameters = new DynamicParameters();
                if (servicioId.HasValue)
                {
                    where = "s.servicio_id = @ServicioId";
                    parameters.Add("ServicioId", servicioId.Value);
                }

                var sql = $@"
                    SELECT s.servicio_id,
                           COALESCE(es.numero_incidente, '') AS servicio_numero,
                           s.item_id,
                           COALESCE(i.nombre, '') AS item_nombre,
                           s.cantidad
                    FROM servicio_insumos_utilizados s
                    LEFT JOIN emergencias_servicios es ON es.servicio_id = s.servicio_id
                    LEFT JOIN inventario_items i ON i.item_id = s.item_id
                    WHERE {where}
                    ORDER BY s.servicio_id, s.item_id";

                var items = (await connection.QueryAsync<ServicioInsumoUtilizadoDto>(sql, parameters)).ToList();
                return ServiceResult<List<ServicioInsumoUtilizadoDto>>.Success(items);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<ServicioInsumoUtilizadoDto>>.Internal($"Error al obtener insumos utilizados: {ex.Message}");
            }
        }

        public async Task<ServiceResult> RegistrarUsoInsumoAsync(ServicioInsumoUtilizadoCreateDto dto)
        {
            using var connection = AbrirConexion();
            using var transaction = connection.BeginTransaction();

            try
            {
                if (dto.Cantidad <= 0)
                {
                    return ServiceResult.BadRequest("La cantidad debe ser mayor a 0.");
                }

                var item = await connection.QueryFirstOrDefaultAsync<(string Nombre, int StockActual)>(
                    "SELECT nombre, stock_actual FROM inventario_items WHERE item_id = @Id",
                    new { Id = dto.ItemId }, transaction);

                if (item == default)
                {
                    return ServiceResult.NotFound("Item no encontrado.");
                }

                if (item.StockActual < dto.Cantidad)
                {
                    return ServiceResult.BadRequest("Stock insuficiente para registrar el uso del insumo.");
                }

                var tipoUso = await connection.QueryFirstOrDefaultAsync<int>(
                    "SELECT tipo_mov_id FROM cat_tipos_movimiento WHERE codigo = 'USO_SERVICIO'",
                    transaction: transaction);

                var servicioExiste = await connection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM emergencias_servicios WHERE servicio_id = @Id)",
                    new { Id = dto.ServicioId }, transaction);
                if (!servicioExiste)
                {
                    return ServiceResult.BadRequest("El servicio de emergencia no existe.");
                }

                await connection.ExecuteAsync(@"
                    INSERT INTO servicio_insumos_utilizados (servicio_id, item_id, cantidad)
                    VALUES (@ServicioId, @ItemId, @Cantidad)
                    ON CONFLICT (servicio_id, item_id) DO UPDATE SET cantidad = servicio_insumos_utilizados.cantidad + EXCLUDED.cantidad;",
                    new { ServicioId = dto.ServicioId, ItemId = dto.ItemId, Cantidad = dto.Cantidad }, transaction);

                await connection.ExecuteAsync(
                    "UPDATE inventario_items SET stock_actual = stock_actual - @Cantidad WHERE item_id = @Id",
                    new { Id = dto.ItemId, Cantidad = dto.Cantidad }, transaction);

                if (tipoUso > 0)
                {
                    await connection.ExecuteAsync(@"
                        INSERT INTO inventario_movimientos (item_id, tipo_mov_id, cantidad, motivo, responsable_id, fecha_hora)
                        VALUES (@ItemId, @TipoMovId, @Cantidad, @Motivo, NULL, CURRENT_TIMESTAMP);",
                        new
                        {
                            ItemId = dto.ItemId,
                            TipoMovId = tipoUso,
                            Cantidad = dto.Cantidad,
                            Motivo = $"Uso en servicio {dto.ServicioId}"
                        }, transaction);
                }

                transaction.Commit();
                return ServiceResult.Success();
            }
            catch (Exception ex)
            {
                try { transaction.Rollback(); } catch { }
                return ServiceResult.Internal($"Error al registrar uso de insumo: {ex.Message}");
            }
        }
    }
}
