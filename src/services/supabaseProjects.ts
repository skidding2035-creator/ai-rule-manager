import type { Project } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { getActiveProjectId, setActiveProjectId, subscribeToActiveProject, notifyProjectChanges } from '@/mock/projects'
import type { ProjectService } from './projects'

function rowToProject(row: { id: string; name: string; color: Project['color'] }): Project {
  return { id: row.id, name: row.name, color: row.color }
}

export const supabaseProjectService: ProjectService = {
  getProjects: async () => {
    const { data, error } = await supabase!.from('projects').select('*').order('created_at')
    if (error) throw new Error(error.message)
    const list = data.map(rowToProject)
    // The local "active project" selection defaults to the mock data's
    // hardcoded string id (e.g. "gworks"), which never matches a real
    // Supabase-generated UUID — self-heal to the first real project so the
    // switcher isn't stuck on "no project selected" the first time this
    // backend loads.
    if (list.length > 0 && !list.some((p) => p.id === getActiveProjectId())) {
      setActiveProjectId(list[0].id)
    }
    return list
  },
  createProject: async (input) => {
    const { data, error } = await supabase!.from('projects').insert({ name: input.name, color: input.color }).select().single()
    if (error) throw new Error(error.message)
    notifyProjectChanges()
    return rowToProject(data)
  },
  updateProject: async (id, input) => {
    const { data, error } = await supabase!
      .from('projects')
      .update({ name: input.name, color: input.color })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    notifyProjectChanges()
    return data ? rowToProject(data) : undefined
  },
  deleteProject: async (id) => {
    const { count } = await supabase!.from('rules').select('id', { count: 'exact', head: true }).eq('project_id', id)
    if (count && count > 0) {
      return { success: false, reason: 'このプロジェクトを使用しているルールがあるため削除できません。' }
    }
    const { error } = await supabase!.from('projects').delete().eq('id', id)
    if (error) return { success: false, reason: error.message }
    notifyProjectChanges()
    return { success: true }
  },
  // Active-project selection is local UI state regardless of backend — same
  // reasoning as the mock implementation, see services/projects.ts.
  getActiveProjectId,
  setActiveProjectId,
  subscribeToActiveProject,
}
