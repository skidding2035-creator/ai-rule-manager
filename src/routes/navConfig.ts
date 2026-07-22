import {
  LayoutDashboard,
  ListChecks,
  ClipboardCheck,
  FolderTree,
  BarChart3,
  FileText,
  History,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  badge?: number
}

export const navConfig: NavItem[] = [
  { path: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { path: '/rules', label: 'ルール一覧', icon: ListChecks },
  { path: '/approvals', label: '承認センター', icon: ClipboardCheck },
  { path: '/categories', label: 'カテゴリ', icon: FolderTree },
  { path: '/analytics', label: '統計・分析', icon: BarChart3 },
  { path: '/reports', label: 'レポート', icon: FileText },
  { path: '/history', label: '履歴', icon: History },
  { path: '/settings', label: '設定', icon: Settings },
]
