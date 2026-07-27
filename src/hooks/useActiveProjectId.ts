import { useSyncExternalStore } from 'react'
import { getProjectService } from '@/services/projects'

// Reactive read of the sidebar's active-project selection. Pages that fetch
// project-scoped data (rules, dashboard summary, history, ...) should include
// this in their fetch effect's dependency array so switching projects in the
// sidebar re-fetches instead of leaving stale data on screen — getActiveProjectId()
// alone isn't reactive, since it's a plain function call, not state.
export function useActiveProjectId(): string {
  return useSyncExternalStore(getProjectService().subscribeToActiveProject, getProjectService().getActiveProjectId)
}
