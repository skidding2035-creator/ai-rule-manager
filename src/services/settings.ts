import type { AIConnection } from '@/types'
import { aiConnections, notifyConnectionChanges } from '@/mock/aiConnections'
import { useSupabase } from '@/lib/supabaseClient'
import { supabaseSettingsService } from './supabaseSettings'

export interface SettingsService {
  getAIConnections(): Promise<AIConnection[]>
  toggleAIConnection(id: string): Promise<AIConnection[]>
}

export const mockSettingsService: SettingsService = {
  getAIConnections: () => new Promise((resolve) => setTimeout(() => resolve(aiConnections), 200)),
  toggleAIConnection: (id) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const conn = aiConnections.find((c) => c.id === id)
        if (conn) {
          conn.connected = !conn.connected
          notifyConnectionChanges()
        }
        resolve(aiConnections)
      }, 200),
    ),
}

export function getSettingsService(): SettingsService {
  return useSupabase() ? supabaseSettingsService : mockSettingsService
}
