// src/stores/auth.ts
import { create } from 'zustand'
import { getAuth, signOut } from 'firebase/auth'
import type { Role } from '@/api/usuarios/types'

export type User = {
  id: number
  nombre?: string
  apellido?: string
  email?: string | null
  username?: string
  telefonoE164?: string | null
  telefonoVerificado?: boolean
  proveedor?: string | null
  proveedorId?: string | null
  avatarUrl?: string | null

  // NUEVO (opcionales, porque puede no venir en todos los tokens/respuestas)
  roles?: Role[]
  barberoId?: number | null
  clienteId?: number | null
}

type AuthState = {
  accessToken: string | null
  user: User | null
  loading: boolean
  setLoading: (v: boolean) => void
  setSession: (token: string | null, user?: User | null) => void
  setUser: (user: User | null) => void
  logout: () => Promise<void>

  // Selectores/computeds prácticos
  isAdmin: () => boolean
  isBarberoOnly: () => boolean
  barberoFiltroId: () => number | undefined
}

export const useAuth = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  setLoading: (v) => set({ loading: v }),

  setSession: (token, user = null) => set({ accessToken: token, user }),

  setUser: (user) => set({ user }),

  logout: async () => {
    const auth = getAuth()
    set({ loading: true })
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Error al cerrar sesión en Firebase', err)
    } finally {
      set({ accessToken: null, user: null, loading: false })
    }
  },

  // === Helpers de rol/permiso ===
  isAdmin: () => {
    const roles = get().user?.roles ?? []
    return roles.includes('ADMIN')
  },

  // true si tiene BARBERO y NO es admin
  isBarberoOnly: () => {
    const roles = get().user?.roles ?? []
    return roles.includes('BARBERO') && !roles.includes('ADMIN')
  },

  /**
   * Si es barbero (y no admin), devuelve su barberoId para filtrar citas.
   * Admin ve todo (regresa undefined para no filtrar).
   */
  barberoFiltroId: () => {
    const u = get().user
    const roles = u?.roles ?? []
    const esAdmin = roles.includes('ADMIN')
    const esBarbero = roles.includes('BARBERO')
    return !esAdmin && esBarbero ? (u?.barberoId ?? undefined) : undefined
  },
}))