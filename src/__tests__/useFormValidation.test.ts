import { describe, it, expect } from 'vitest'
import {
  sanitizeNumber,
  validateNumber,
  validateRequired,
  validateMin,
  validateMax,
} from '@/hooks/useFormValidation'

describe('sanitizeNumber', () => {
  it('elimina letras y símbolos de un campo entero', () => {
    expect(sanitizeNumber('12a3b')).toBe('123')
    expect(sanitizeNumber('abc')).toBe('')
    expect(sanitizeNumber('1,234')).toBe('1234')
    expect(sanitizeNumber('Q100')).toBe('100')
  })

  it('permite decimales cuando se solicita', () => {
    expect(sanitizeNumber('12.50', true)).toBe('12.50')
    expect(sanitizeNumber('12.5.0', true)).toBe('12.50')
    expect(sanitizeNumber('abc', true)).toBe('')
  })

  it('rechaza decimales en modo entero', () => {
    expect(sanitizeNumber('12.5', false)).toBe('125')
  })
})

describe('validadores', () => {
  it('validateRequired exige valor', () => {
    expect(validateRequired('', 'Campo')).toBe('Campo es obligatorio')
    expect(validateRequired('x', 'Campo')).toBeNull()
  })

  it('validateNumber valida números', () => {
    expect(validateNumber('abc', 'Monto')).toBe('Monto debe ser un número válido')
    expect(validateNumber('', 'Monto')).toBe('Monto es obligatorio')
    expect(validateNumber('100', 'Monto')).toBeNull()
  })

  it('validateMin y validateMax aplican límites', () => {
    expect(validateMin('5', 10, 'Valor')).toBe('Valor debe ser mayor o igual a 10')
    expect(validateMin('10', 10, 'Valor')).toBeNull()
    expect(validateMax('15', 10, 'Valor')).toBe('Valor debe ser menor o igual a 10')
    expect(validateMax('5', 10, 'Valor')).toBeNull()
  })
})
