import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { finanzasService } from '@/services/finanzasService'

function stubFetch(response: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => response,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('finanzasService (transacciones)', () => {
  it('construye la URL con filtros y paginación', async () => {
    const fetchMock = stubFetch({
      success: true,
      message: '',
      data: { items: [], totalItems: 0, paginaActual: 2, tamanoPagina: 8, totalPaginas: 1 },
    })

    await finanzasService.getTransacciones({
      pagina: 2,
      tamanio: 8,
      tipo: 'GASTO',
      busqueda: 'mantenimiento',
    })

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('/finanzas')
    expect(url).toContain('pagina=2')
    expect(url).toContain('tipo=GASTO')
    expect(url).toContain('busqueda=mantenimiento')
  })

  it('omite los filtros vacíos de la URL', async () => {
    const fetchMock = stubFetch({
      success: true,
      message: '',
      data: { items: [], totalItems: 0, paginaActual: 1, tamanoPagina: 8, totalPaginas: 1 },
    })

    await finanzasService.getTransacciones({ pagina: 1, tamanio: 8 })

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).not.toContain('tipo=')
    expect(url).not.toContain('busqueda=')
    expect(url).not.toContain('fechaDesde=')
  })

  it('crea una transacción con el cuerpo correcto', async () => {
    const fetchMock = stubFetch({ success: true, message: '', data: { transaccionId: 1 } })

    await finanzasService.createTransaccion({
      tipo: 'INGRESO',
      descripcion: 'Aportación',
      monto: 100,
      referencia: 'R-1',
    })

    const call = fetchMock.mock.calls[0]
    expect(call[1].method).toBe('POST')
    expect(JSON.parse(call[1].body)).toEqual({
      tipo: 'INGRESO',
      descripcion: 'Aportación',
      monto: 100,
      referencia: 'R-1',
    })
  })

  it('actualiza una transacción', async () => {
    const fetchMock = stubFetch({ success: true, message: '', data: { transaccionId: 5 } })

    await finanzasService.updateTransaccion(5, {
      tipo: 'GASTO',
      descripcion: 'Reparación',
      monto: 200,
    })

    const call = fetchMock.mock.calls[0]
    expect(call[0]).toContain('/finanzas/5')
    expect(call[1].method).toBe('PUT')
    expect(JSON.parse(call[1].body)).toEqual({ tipo: 'GASTO', descripcion: 'Reparación', monto: 200 })
  })

  it('elimina una transacción', async () => {
    const fetchMock = stubFetch({ success: true, message: '', data: null })

    await finanzasService.deleteTransaccion(7)

    const call = fetchMock.mock.calls[0]
    expect(call[0]).toContain('/finanzas/7')
    expect(call[1].method).toBe('DELETE')
  })

  it('obtiene el resumen financiero', async () => {
    stubFetch({
      success: true,
      message: '',
      data: { totalIngresos: 100, totalGastos: 40, totalDonaciones: 30, balance: 90 },
    })

    const resumen = await finanzasService.getResumen('2026-01-01', '2026-12-31')

    expect(resumen.totalIngresos).toBe(100)
    expect(resumen.balance).toBe(90)
  })
})
