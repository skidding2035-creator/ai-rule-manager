import type { Category } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import type { CategoryService } from './categories'

function rowToCategory(row: { id: string; name: string; color: Category['color']; code_prefix: string }): Category {
  return { id: row.id, name: row.name, color: row.color, codePrefix: row.code_prefix }
}

export const supabaseCategoryService: CategoryService = {
  getCategories: async () => {
    const { data, error } = await supabase!.from('categories').select('*').order('created_at')
    if (error) throw new Error(error.message)
    return data.map(rowToCategory)
  },
  createCategory: async (input) => {
    const { data, error } = await supabase!
      .from('categories')
      .insert({ name: input.name, color: input.color, code_prefix: input.codePrefix })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return rowToCategory(data)
  },
  updateCategory: async (id, input) => {
    const { data, error } = await supabase!
      .from('categories')
      .update({ name: input.name, color: input.color, code_prefix: input.codePrefix })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data ? rowToCategory(data) : undefined
  },
  deleteCategory: async (id) => {
    const { count } = await supabase!.from('rules').select('id', { count: 'exact', head: true }).eq('category_id', id)
    if (count && count > 0) {
      return { success: false, reason: 'このカテゴリを使用しているルールがあるため削除できません。' }
    }
    const { error } = await supabase!.from('categories').delete().eq('id', id)
    if (error) return { success: false, reason: error.message }
    return { success: true }
  },
}
