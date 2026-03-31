import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'staff' | null

type AuthContextValue = {
  session: Session | null
  user: User | null
  fullName: string
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

  return normalizeRole(user.user_metadata?.role)
}

async function getFullNameForUser(user: User | null): Promise<string> {
  if (!user) return ''

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle<{ full_name: string | null }>()

  if (!error && data?.full_name) {
    return data.full_name
  }

  const metaName = user.user_metadata?.full_name
  if (typeof metaName === 'string' && metaName.trim()) {
    return metaName.trim()
  }

  return user.email || ''
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  const refreshRole = async () => {
    const nextRole = await getRoleForUser(user)
    setRole(nextRole)
  }

  useEffect(() => {
    let isMounted = true
    let initialized = false
    let lastSessionId: string | null = null

    const applyAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return

      const nextUser = nextSession?.user ?? null
      const nextSessionId = nextSession?.access_token ?? null

      if (initialized && lastSessionId === nextSessionId) {
        return
      }

      setSession(nextSession)
      setUser(nextUser)
      const [nextRole, nextFullName] = await Promise.all([
        getRoleForUser(nextUser),
        getFullNameForUser(nextUser),
      ])
      setRole(nextRole)
      setFullName(nextFullName)
      lastSessionId = nextSessionId
    }

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        await applyAuthState(data.session)
      } finally {
        initialized = true
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return
      await applyAuthState(nextSession)

      // Keep loading true until bootstrap finishes the initial session+role resolution.
      if (initialized && isMounted) {
        setLoading(false)
      }
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
    setFullName('')
    setRole(null)
  }

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    fullName,
    role,
    loading,
    signOut,
    refreshRole,
  }), [session, user, fullName, role, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
