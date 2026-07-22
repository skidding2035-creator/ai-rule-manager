import { Plus, Search, FolderTree, ClipboardCheck, BarChart3, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { QuickActionTile } from '@/components/ui/QuickActionTile'

const actions = [
  {
    icon: Plus,
    label: 'ルールを追加',
    to: '/rules/new',
    colorClasses: 'border-accent-blue bg-accent-blue text-white hover:bg-blue-600',
  },
  {
    icon: Search,
    label: 'ルールを検索',
    to: '/rules',
    colorClasses: 'border-accent-blue/40 bg-transparent text-accent-blue hover:bg-accent-blue/10',
  },
  {
    icon: FolderTree,
    label: 'カテゴリ管理',
    to: '/categories',
    colorClasses: 'border-transparent bg-accent-purple/15 text-accent-purple hover:bg-accent-purple/25',
  },
  {
    icon: ClipboardCheck,
    label: '承認センター',
    to: '/approvals',
    colorClasses: 'border-transparent bg-accent-orange/15 text-accent-orange hover:bg-accent-orange/25',
  },
  {
    icon: BarChart3,
    label: '統計・分析',
    to: '/analytics',
    colorClasses: 'border-transparent bg-accent-teal/15 text-accent-teal hover:bg-accent-teal/25',
  },
  {
    icon: FileText,
    label: 'レポート作成',
    to: '/reports',
    colorClasses: 'border-transparent bg-accent-green/15 text-accent-green hover:bg-accent-green/25',
  },
]

export function QuickActionsCard() {
  return (
    <Card title="クイックアクション">
      <div className="grid grid-cols-6 gap-4">
        {actions.map((action) => (
          <QuickActionTile key={action.label} {...action} />
        ))}
      </div>
    </Card>
  )
}
