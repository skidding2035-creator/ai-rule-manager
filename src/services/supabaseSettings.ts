import type { AIConnection } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { notifyConnectionChanges } from '@/mock/aiConnections'
import type { SettingsService } from './settings'

function rowToConnection(row: { id: string; name: AIConnection['name']; connected: boolean }): AIConnection {
  return { id: row.id, name: row.name, connected: row.connected }
}

export const supabaseSettingsService: SettingsService = {
  getAIConnections: async () => {
    const { data, error } = await supabase!.from('ai_connections').select('*')
    if (error) throw new Error(error.message)
    return data.map(rowToConnection)
  },
  toggleAIConnection: async (id) => {
    const { data: current, error: fetchError } = await supabase!.from('ai_connections').select('connected').eq('id', id).single()
    if (fetchError) throw new Error(fetchError.message)
    const { error: updateError } = await supabase!.from('ai_connections').update({ connected: !current.connected }).eq('id', id)
    if (updateError) throw new Error(updateError.message)
    const { data, error } = await supabase!.from('ai_connections').select('*')
    if (error) throw new Error(error.message)
    notifyConnectionChanges()
    return data.map(rowToConnection)
  },
}
