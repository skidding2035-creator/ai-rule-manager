import type { AIConnection } from '@/types'

export const aiConnections: AIConnection[] = [
  { id: 'chatgpt', name: 'ChatGPT', connected: true },
  { id: 'claude', name: 'Claude', connected: true },
  { id: 'gemini', name: 'Gemini', connected: false },
  { id: 'copilot', name: 'Copilot', connected: false },
]

// Same minimal pub/sub as mock/rules.ts, so long-lived components (the sidebar)
// can react to in-place mutations of `aiConnections` from anywhere in the app.
type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeToConnectionChanges(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyConnectionChanges() {
  listeners.forEach((listener) => listener())
}
