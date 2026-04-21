import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
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

  const fallbackFullName = getFallbackFullName(user)

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)

      return {
        role: null,
        fullName: fallbackFullName,
        authError: 'We could not load your account profile. Please sign in again or contact an administrator.',
      }
    }

    const resolvedFullName = typeof profile.full_name === 'string' && profile.full_name.trim()
      ? profile.full_name.trim()
      : fallbackFullName
    const resolvedRole = normalizeRole(profile.role)

    if (!resolvedRole) {
      console.error(`Profile role is missing or invalid for authenticated user ${user.id}.`, {
        profileRole: profile.role,
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
    console.error('Profile fetch error:', error)

    return {
      role: null,
      fullName: fallbackFullName,
      authError: 'We could not load your account profile. Please sign in again or contact an administrator.',
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

  const clearAuthState = (nextAuthError: string | null = null) => {
    setSession(null)
    setUser(null)
    setFullName('')
    setRole(null)
    setAuthError(nextAuthError)
  }

  const getAuthenticatedSessionState = async (nextSession: Session) => {
    const resolvedProfile = await resolveUserProfile(nextSession.user)

    return {
      session: nextSession,
      user: nextSession.user,
      fullName: resolvedProfile.fullName,
      role: resolvedProfile.role,
      authError: resolvedProfile.authError,
    }
  }

  const refreshRole = async () => {
    if (!user) {
      clearAuthState()
      return
    }

    const resolvedProfile = await resolveUserProfile(user)
    setFullName(resolvedProfile.fullName)
    setRole(resolvedProfile.role)
    setAuthError(resolvedProfile.authError)
  }

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (currentSession) {
          const nextAuthState = await getAuthenticatedSessionState(currentSession)

          if (!isMounted) return

          setSession(nextAuthState.session)
          setUser(nextAuthState.user)
          setFullName(nextAuthState.fullName)
          setRole(nextAuthState.role)
          setAuthError(nextAuthState.authError)
        } else {
          if (!isMounted) return
          clearAuthState()
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)

        if (isMounted) {
          clearAuthState()
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void initializeAuth()

    const handleAuthStateChange = async (event: AuthChangeEvent, nextSession: Session | null) => {
      if (!isMounted || event === 'INITIAL_SESSION') {
        return
      }

      try {
        if (event === 'SIGNED_OUT') {
          clearAuthState()
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (nextSession) {
            const nextAuthState = await getAuthenticatedSessionState(nextSession)

            if (!isMounted) return

            setSession(nextAuthState.session)
            setUser(nextAuthState.user)
            setFullName(nextAuthState.fullName)
            setRole(nextAuthState.role)
            setAuthError(nextAuthState.authError)
          } else {
            clearAuthState()
          }
        }
      } catch (error) {
        console.error('Auth state change handling failed:', error)

        if (isMounted) {
          if (nextSession) {
            setSession(nextSession)
            setUser(nextSession.user)
            setFullName(getFallbackFullName(nextSession.user))
            setRole(null)
            setAuthError('We could not load your account profile. Please sign in again or contact an administrator.')
          } else {
            clearAuthState()
          }
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void handleAuthStateChange(event, nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    clearAuthState()
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
