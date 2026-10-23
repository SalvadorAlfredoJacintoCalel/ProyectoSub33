import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePermisos } from '@/hooks/usePermisos'

type AuthMock = {
  role: string
  user: { personalId: string | null } | null
  modulos: string[]
  permisos: string[]
}

const mocks = vi.hoisted(() => ({
  auth: {} as AuthMock,
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mocks.auth,
}))

describe('usePermisos', () => {
  beforeEach(() => {
    mocks.auth = {
      role: 'voluntario',
      user: { personalId: 'p-123' },
      modulos: ['emergencias', 'inventario', 'vehiculos'],
      permisos: [],
    }
  })

  it('admin tiene todos los permisos (fallback sin permisos cargados)', () => {
    mocks.auth.role = 'admin'
    const p = usePermisos()

    expect(p.isAdmin).toBe(true)
    expect(p.personal.crear).toBe(true)
    expect(p.vehiculos.crud).toBe(true)
    expect(p.donaciones.registrar).toBe(true)
  })

  it('secretario tiene permisos de inventario', () => {
    mocks.auth.role = 'secretario'
    const p = usePermisos()

    expect(p.isSecretario).toBe(true)
    expect(p.inventario.crear).toBe(true)
    expect(p.inventario.editar).toBe(true)
    expect(p.seguridad.editar).toBe(false)
  })

  it('voluntario ve lo suyo y no puede editar cupones', () => {
    const p = usePermisos()

    expect(p.isVoluntario).toBe(true)
    expect(p.vehiculos.ver).toBe(true)
    expect(p.vehiculos.editarCupon).toBe(false)
    expect(p.donaciones.registrar).toBe(false)
  })

  it('usa los permisos granulares del backend cuando están cargados', () => {
    mocks.auth.permisos = ['vehiculos.cupones.editar', 'donaciones.registrar']
    const p = usePermisos()

    expect(p.vehiculos.editarCupon).toBe(true)
    expect(p.donaciones.registrar).toBe(true)
  })

  it('emergencias.editarPropia respeta el ownership', () => {
    mocks.auth.permisos = ['emergencias.editar']
    const p = usePermisos()

    expect(p.emergencias.editarPropia('p-123')).toBe(true)
    expect(p.emergencias.editarPropia('otro')).toBe(false)
    expect(p.emergencias.editarAjena).toBe(false)
  })

  it('admin puede editar emergencias ajenas', () => {
    mocks.auth.role = 'admin'
    const p = usePermisos()

    expect(p.emergencias.editarAjena).toBe(true)
    expect(p.emergencias.editarPropia('otro')).toBe(true)
  })
})
