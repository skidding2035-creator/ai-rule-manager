import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from '@/lib/auth'
import { useSupabase } from '@/lib/supabaseClient'

interface AuthState {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ session: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  // Mock mode has no backend to authenticate against — treat it as always
  // "signed in" so the offline/demo path stays login-free.
  const [state, setState] = useState<AuthState>({ session: null, loading: useSupabase() })

  useEffect(() => {
    if (!useSupabase()) return
    let cancelled = false
    getSession().then((session) => {
      if (!cancelled) setState({ session, loading: false })
    })
    const unsubscribe = onAuthStateChange((session) => setState({ session, loading: false }))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
