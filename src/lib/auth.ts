import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase!.auth.getSession()
  if (error) throw new Error(error.message)
  return data.session
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase!.auth.onAuthStateChange((_event, session) => callback(session))
  return () => subscription.unsubscribe()
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase!.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase!.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
}

export async function signOut(): Promise<void> {
  const { error } = await supabase!.auth.signOut()
  if (error) throw new Error(error.message)
}
