import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabaseClient'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  const resolveAdmin = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession)
    if (!nextSession || !supabase) {
      setIsAdmin(false)
      return false
    }

    const { data, error } = await supabase.rpc('is_admin')
    if (error) {
      setIsAdmin(false)
      return false
    }

    const allowed = data === true
    setIsAdmin(allowed)
    return allowed
  }, [])

  useEffect(() => {
    if (!supabase) {
      return
    }

    let active = true
    void supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) throw error
        if (active) await resolveAdmin(data.session)
      })
      .catch(() => {
        if (active) {
          setSession(null)
          setIsAdmin(false)
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      void resolveAdmin(nextSession).catch(() => {
        if (active) {
          setSession(null)
          setIsAdmin(false)
        }
      })
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [resolveAdmin])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = requireSupabase()
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw error

      let allowed: boolean
      try {
        allowed = await resolveAdmin(data.session)
      } catch (adminCheckError) {
        await client.auth.signOut()
        setSession(null)
        setIsAdmin(false)
        throw adminCheckError
      }
      if (!allowed) {
        await client.auth.signOut()
        setSession(null)
        setIsAdmin(false)
        throw new Error('Tài khoản này không có quyền quản trị ứng dụng.')
      }
    },
    [resolveAdmin],
  )

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
    setSession(null)
    setIsAdmin(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signOut,
    }),
    [isAdmin, isLoading, session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
