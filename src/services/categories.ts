import type { AccentColor, Category } from '@/types'
import { categories } from '@/mock/categories'
import { rules } from '@/mock/rules'
import { useSupabase } from '@/lib/supabaseClient'
import { supabaseCategoryService } from './supabaseCategories'

export interface CategoryInput {
  name: string
  color: AccentColor
  codePrefix: string
}

export interface DeleteCategoryResult {
  success: boolean
  reason?: string
}

export interface CategoryService {
  getCategories(): Promise<Category[]>
  createCategory(input: CategoryInput): Promise<Category>
  updateCategory(id: string, input: CategoryInput): Promise<Category | undefined>
  deleteCategory(id: string): Promise<DeleteCategoryResult>
}

export const mockCategoryService: CategoryService = {
  getCategories: () => new Promise((resolve) => setTimeout(() => resolve(categories), 200)),
  createCategory: (input) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const category: Category = { id: crypto.randomUUID(), ...input }
        categories.push(category)
        resolve(category)
      }, 200),
    ),
  updateCategory: (id, input) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const category = categories.find((c) => c.id === id)
        if (category) {
          category.name = input.name
          category.color = input.color
          category.codePrefix = input.codePrefix
        }
        resolve(category)
      }, 200),
    ),
  deleteCategory: (id) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const inUse = rules.some((r) => r.categoryId === id)
        if (inUse) {
          resolve({ success: false, reason: 'このカテゴリを使用しているルールがあるため削除できません。' })
          return
        }
        const index = categories.findIndex((c) => c.id === id)
        if (index !== -1) categories.splice(index, 1)
        resolve({ success: true })
      }, 200),
    ),
}

export function getCategoryService(): CategoryService {
  return useSupabase() ? supabaseCategoryService : mockCategoryService
}
