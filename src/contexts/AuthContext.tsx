import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'staff' | null

type AuthContextValue = {
  session: Session | null
  user: User | null
  fullName: string
  role: UserRole
  authError: string | null
  loading: boolean
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeRole(value: string | null | undefined): UserRole {
  if (value === 'admin' || value === 'staff') return value
  return null
}

function getFallbackRole(user: User | null): UserRole {
  return normalizeRole(user?.user_metadata?.role)
}

function getFallbackFullName(user: User | null): string {
  if (!user) return ''
  const metaName = user.user_metadata?.full_name
  if (typeof metaName === 'string' && metaName.trim()) {
    return metaName.trim()
  }

  return user.email || ''
}

type ResolvedUserProfile = {
  role: UserRole
  fullName: string
  authError: string | null
}

async function resolveUserProfile(user: User | null): Promise<ResolvedUserProfile> {
  if (!user) {
    return {
      role: null,
      fullName: '',
      authError: null,
    }
  }

  const fallbackRole = getFallbackRole(user)
  const fallbackFullName = getFallbackFullName(user)

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle<{ role: string | null, full_name: string | null }>()

    if (error) {
      console.error('Failed to fetch authenticated user profile from Supabase.', error)

      if (fallbackRole) {
        return {
          role: fallbackRole,
          fullName: fallbackFullName,
          authError: null,
        }
      }

      return {
        role: null,
        fullName: fallbackFullName,
        authError: 'We could not load your account permissions. Please sign in again or contact an administrator.',
      }
    }

    if (!data) {
      console.error(`Missing profile record for authenticated user ${user.id}.`)

      return {
        role: null,
        fullName: fallbackFullName,
        authError: 'Your account profile is missing. Please contact an administrator.',
      }
    }

    const resolvedRole = normalizeRole(data.role) ?? fallbackRole
    const resolvedFullName = typeof data.full_name === 'string' && data.full_name.trim()
      ? data.full_name.trim()
      : fallbackFullName

    if (!resolvedRole) {
      console.error(`Missing valid role for authenticated user ${user.id}.`, {
        profileRole: data.role,
        metadataRole: user.user_metadata?.role,
      })

      return {
        role: null,
        fullName: resolvedFullName,
        authError: 'Your account does not have a valid role assigned. Please contact an administrator.',
      }
    }

    return {
      role: resolvedRole,
      fullName: resolvedFullName,
      authError: null,
    }
  } catch (error) {
    console.error('Unexpected error while resolving authenticated user profile.', error)

    if (fallbackRole) {
      return {
        role: fallbackRole,
        fullName: fallbackFullName,
        authError: null,
      }
    }

    return {
      role: null,
      fullName: fallbackFullName,
      authError: 'We could not verify your account permissions. Please sign in again or contact an administrator.',
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshRole = async () => {
    const resolvedProfile = await resolveUserProfile(user)
    setRole(resolvedProfile.role)
    setFullName(resolvedProfile.fullName)
    setAuthError(resolvedProfile.authError)
  }

  useEffect(() => {
    let isMounted = true
    let hasResolvedAuthState = false
    let lastSessionId: string | null = null

    const applyAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return

      const nextUser = nextSession?.user ?? null
      const nextSessionId = nextSession?.access_token ?? null

      if (hasResolvedAuthState && lastSessionId === nextSessionId) {
        return
      }

      const resolvedProfile = await resolveUserProfile(nextUser)

      if (!isMounted) return

      setSession(nextSession)
      setUser(nextUser)
      setRole(resolvedProfile.role)
      setFullName(resolvedProfile.fullName)
      setAuthError(resolvedProfile.authError)
      lastSessionId = nextSessionId
      hasResolvedAuthState = true
    }

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        await applyAuthState(data.session)
      } catch (error) {
        console.error('Failed to restore Supabase session during app bootstrap.', error)

        if (isMounted) {
          setSession(null)
          setUser(null)
          setRole(null)
          setFullName('')
          setAuthError('We could not restore your session. Please sign in again.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        if (!isMounted) return
        await applyAuthState(nextSession)
      } catch (error) {
        console.error('Failed to apply Supabase auth state change.', error)

        if (isMounted) {
          const nextUser = nextSession?.user ?? null
          setSession(nextSession)
          setUser(nextUser)
          setRole(null)
          setFullName(getFallbackFullName(nextUser))
          setAuthError(nextUser ? 'We could not finish loading your account. Please sign in again or contact an administrator.' : null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
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
    setAuthError(null)
    setLoading(false)
  }

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    fullName,
    role,
    authError,
    loading,
    signOut,
    refreshRole,
  }), [session, user, fullName, role, authError, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
