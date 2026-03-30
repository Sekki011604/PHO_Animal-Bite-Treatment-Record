import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'staff' | null

type AuthContextValue = {
  session: Session | null
  user: User | null
  role: UserRole
  loading: boolean
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeRole(value: string | null | undefined): UserRole {
  if (value === 'admin' || value === 'staff') return value
  return null
}

function fallbackRole(user: User | null): UserRole {
  if (!user) return null

  const metadataRole = normalizeRole(user.user_metadata?.role)
  if (metadataRole) return metadataRole

  if ((user.email || '').toLowerCase() === 'admin@pho.gov') {
    return 'admin'
  }

  return 'staff'
}

async function getRoleForUser(user: User | null): Promise<UserRole> {
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string | null }>()

  if (!error) {
    const dbRole = normalizeRole(data?.role)
    if (dbRole) return dbRole
  }

  return fallbackRole(user)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  const refreshRole = async () => {
    const nextRole = await getRoleForUser(user)
    setRole(nextRole)
  }

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return

      const nextSession = data.session
      const nextUser = nextSession?.user ?? null

      setSession(nextSession)
      setUser(nextUser)
      setRole(await getRoleForUser(nextUser))
      setLoading(false)
    }

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return

      const nextUser = nextSession?.user ?? null
      setSession(nextSession)
      setUser(nextUser)
      setRole(await getRoleForUser(nextUser))
      setLoading(false)
    })

    void bootstrap()

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setRole(null)
  }

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    role,
    loading,
    signOut,
    refreshRole,
  }), [session, user, role, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
