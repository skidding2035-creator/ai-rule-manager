import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only constructed when actually needed (see useSupabase below) — with the
// mock backend, VITE_SUPABASE_URL/ANON_KEY are never set, and createClient
// would throw on an empty URL if called eagerly at module load.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export function useSupabase(): boolean {
  return import.meta.env.VITE_USE_SUPABASE === 'true'
}
