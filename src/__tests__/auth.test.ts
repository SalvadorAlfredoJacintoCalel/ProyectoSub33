import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { normalizeRole } from '@/constants/roles'
import { login } from '@/services/authService'
import { tokenStore } from '@/services/auth/tokenStore'

describe('normalizeRole', () => {
  it('mapea Administrador (español) a admin', () => {
    expect(normalizeRole(['Administrador'])).toBe('admin')
  })

  it('mapea admin/administrator a admin', () => {
    expect(normalizeRole(['admin'])).toBe('admin')
    expect(normalizeRole(['ADMINISTRATOR'])).toBe('admin')
  })

  it('mapea Secretario/Secretary a secretario', () => {
    expect(normalizeRole(['Secretario'])).toBe('secretario')
    expect(normalizeRole(['Secretary'])).toBe('secretario')
  })

  it('cae a voluntario por defecto', () => {
    expect(normalizeRole(['Voluntario'])).toBe('voluntario')
    expect(normalizeRole([])).toBe('voluntario')
    expect(normalizeRole(null)).toBe('voluntario')
    expect(normalizeRole(undefined)).toBe('voluntario')
  })

  it('prioriza admin por encima de otros roles', () => {
    expect(normalizeRole(['voluntario', 'secretario', 'admin'])).toBe('admin')
  })

  it('es case-insensitive y tolera espacios', () => {
    expect(normalizeRole(['  ADMINISTRADOR  '])).toBe('admin')
  })
})

describe('login (authService)', () => {
  beforeEach(() => {
    tokenStore.clear()
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

  it('guarda el token y normaliza el rol al iniciar sesión', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'jwt-token',
        roles: ['Administrador'],
        username: 'sjacinto',
        nombreCompleto: 'S. Jacinto',
        personalId: 'uuid-1',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await login('sjacinto', 'clave')

    expect(result.success).toBe(true)
    expect(result.token).toBe('jwt-token')
    expect(result.user.role).toBe('admin')
    expect(tokenStore.get()).toBe('jwt-token')
  })

  it('devuelve error cuando las credenciales son incorrectas', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ mensaje: 'Las credenciales ingresadas son incorrectas.' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await login('sjacinto', 'mala-clave')

    expect(result.success).toBe(false)
    expect(result.error).toContain('incorrectas')
  })

  it('devuelve error si la respuesta no incluye token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ roles: ['Administrador'] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await login('sjacinto', 'clave')

    expect(result.success).toBe(false)
    expect(result.error).toContain('token')
  })
})
