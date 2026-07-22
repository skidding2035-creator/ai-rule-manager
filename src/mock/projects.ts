import type { Project } from '@/types'

export const projects: Project[] = [
  { id: 'gworks', name: 'G-Works', color: 'blue' },
  { id: 'rpg', name: 'RPG制作', color: 'purple' },
  { id: 'personal', name: '個人相談', color: 'teal' },
]

// The active project is app-wide selection state (not per-rule data like the
// arrays above), but uses the same module-level pub/sub pattern already
// established for rules/categories/aiConnections so long-lived components
// (the sidebar switcher, and any page that filters by it) can react.
let activeProjectId: string = projects[0].id

type Listener = () => void
const listeners = new Set<Listener>()

export function getActiveProjectId(): string {
  return activeProjectId
}

export function setActiveProjectId(id: string) {
  activeProjectId = id
  listeners.forEach((listener) => listener())
}

export function subscribeToActiveProject(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Separate from the active-selection pub/sub above: fires when the project
// *list itself* changes (create/update/delete), so long-lived components
// (the sidebar switcher) that can't just re-read a mutated-in-place array
// (e.g. once backed by Supabase) know to refetch.
const listListeners = new Set<Listener>()

export function subscribeToProjectChanges(listener: Listener): () => void {
  listListeners.add(listener)
  return () => listListeners.delete(listener)
}

export function notifyProjectChanges() {
  listListeners.forEach((listener) => listener())
}
