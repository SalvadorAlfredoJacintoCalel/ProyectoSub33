import { describe, it, expect } from 'vitest'
import { formatDate } from '@/utils/format'
import {
  estadoOperativoVariant,
  origenVariant,
  registroVariant,
} from '@/app/pages/Vehiculos/components/vehiculoHelpers'

describe('formatDate (util de cupones/vehículos)', () => {
  it('formatea ISO a dd/mm/yyyy', () => {
    expect(formatDate('2026-10-05T00:00:00Z')).toBe('05/10/2026')
  })

  it('devuelve raya para valores vacíos', () => {
    expect(formatDate('')).toBe('—')
  })
})

describe('helpers de estado (vehículos/cupones)', () => {
  it('mapea estados operativos a variantes de badge', () => {
    expect(estadoOperativoVariant('Operativa')).toBe('success')
    expect(estadoOperativoVariant('En Servicio')).toBe('info')
    expect(estadoOperativoVariant('Mantenimiento')).toBe('warning')
    expect(estadoOperativoVariant('Fuera de Servicio')).toBe('error')
    expect(estadoOperativoVariant('Desconocido')).toBe('default')
  })

  it('marca origen donado como brand', () => {
    expect(origenVariant('Donado')).toBe('brand')
    expect(origenVariant('Comprado')).toBe('default')
  })

  it('marca registro activo como success', () => {
    expect(registroVariant('Activo')).toBe('success')
    expect(registroVariant('Inactivo')).toBe('default')
  })
})
