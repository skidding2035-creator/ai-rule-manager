import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabase } from '@/lib/supabaseClient'

export function RequireAuth() {
  const { session, loading } = useAuth()

  // Mock mode has no login to gate — see AuthProvider.
  if (!useSupabase()) return <Outlet />

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
