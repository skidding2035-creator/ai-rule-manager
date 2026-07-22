import type { Category, AccentColor } from '@/types'

export const categories: Category[] = [
  { id: 'image', name: '画像生成', color: 'blue', codePrefix: 'IMG' },
  { id: 'writing', name: '文章作成', color: 'green', codePrefix: 'TXT' },
  { id: 'pdf', name: 'PDF・ドキュメント', color: 'purple', codePrefix: 'DOC' },
  { id: 'business', name: '業務・仕事', color: 'orange', codePrefix: 'BUS' },
  { id: 'ops', name: '運用・管理', color: 'teal', codePrefix: 'OPS' },
  { id: 'other', name: 'その他', color: 'gray', codePrefix: 'OTH' },
]

export const ALL_ACCENT_COLORS: AccentColor[] = ['blue', 'green', 'orange', 'purple', 'teal', 'red', 'gray']
