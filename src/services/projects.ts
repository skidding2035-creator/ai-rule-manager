import type { AccentColor, Project } from '@/types'
import {
  projects,
  getActiveProjectId,
  setActiveProjectId,
  subscribeToActiveProject,
  notifyProjectChanges,
} from '@/mock/projects'
import { rules } from '@/mock/rules'
import { useSupabase } from '@/lib/supabaseClient'
import { supabaseProjectService } from './supabaseProjects'

export interface ProjectInput {
  name: string
  color: AccentColor
}

export interface DeleteProjectResult {
  success: boolean
  reason?: string
}

export interface ProjectService {
  getProjects(): Promise<Project[]>
  createProject(input: ProjectInput): Promise<Project>
  updateProject(id: string, input: ProjectInput): Promise<Project | undefined>
  deleteProject(id: string): Promise<DeleteProjectResult>
  getActiveProjectId(): string
  setActiveProjectId(id: string): void
  subscribeToActiveProject(listener: () => void): () => void
}

export const mockProjectService: ProjectService = {
  getProjects: () => new Promise((resolve) => setTimeout(() => resolve(projects), 200)),
  createProject: (input) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const project: Project = { id: crypto.randomUUID(), ...input }
        projects.push(project)
        notifyProjectChanges()
        resolve(project)
      }, 200),
    ),
  updateProject: (id, input) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const project = projects.find((p) => p.id === id)
        if (project) {
          project.name = input.name
          project.color = input.color
        }
        notifyProjectChanges()
        resolve(project)
      }, 200),
    ),
  deleteProject: (id) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const inUse = rules.some((r) => r.projectId === id)
        if (inUse) {
          resolve({ success: false, reason: 'このプロジェクトを使用しているルールがあるため削除できません。' })
          return
        }
        const index = projects.findIndex((p) => p.id === id)
        if (index !== -1) projects.splice(index, 1)
        notifyProjectChanges()
        resolve({ success: true })
      }, 200),
    ),
  // Active-project selection isn't async server state — it's local UI state —
  // but exposed here too so pages only ever need to import one project entry
  // point, same as the rest of the service layer.
  getActiveProjectId,
  setActiveProjectId,
  subscribeToActiveProject,
}

export function getProjectService(): ProjectService {
  return useSupabase() ? supabaseProjectService : mockProjectService
}
