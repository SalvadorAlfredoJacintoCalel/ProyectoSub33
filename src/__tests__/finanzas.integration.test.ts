import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { finanzasService } from '@/services/finanzasService'

function stubFetch(response: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
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

describe('auto-registro Finanzas (integración)', () => {
  it('Mantenimiento → Gasto: registra el gasto automáticamente', async () => {
    const fetchMock = stubFetch({
      success: true,
      message: '',
      data: { transaccionId: 9, tipo: 'GASTO', monto: 250.5 },
    })

    const result = await finanzasService.crearGastoDesdeMantenimiento(
      1,
      250.5,
      'Mantenimiento #1 - Toyota Hilux',
    )

    const call = fetchMock.mock.calls[0]
    expect(call[0]).toContain('/finanzas/auto/gasto-mantenimiento')
    expect(call[1].method).toBe('POST')
    expect(JSON.parse(call[1].body)).toEqual({
      mantenimientoId: 1,
      costo: 250.5,
      descripcion: 'Mantenimiento #1 - Toyota Hilux',
    })
    expect(result.tipo).toBe('GASTO')
  })

  it('Donaciones → Ingreso: registra la donación monetaria automáticamente', async () => {
    const fetchMock = stubFetch({
      success: true,
      message: '',
      data: { transaccionId: 10, tipo: 'DONACION', monto: 500 },
    })

    const result = await finanzasService.crearIngresoDesdeDonacion(3, 500, 'Donación Monetaria - Juan Pérez')

    const call = fetchMock.mock.calls[0]
    expect(call[0]).toContain('/finanzas/auto/ingreso-donacion')
    expect(call[1].method).toBe('POST')
    expect(JSON.parse(call[1].body)).toEqual({
      donacionId: 3,
      monto: 500,
      descripcion: 'Donación Monetaria - Juan Pérez',
    })
    expect(result.tipo).toBe('DONACION')
  })
})
