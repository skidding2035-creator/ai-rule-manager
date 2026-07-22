import { FileText, ShieldCheck, Hourglass, FolderOpen } from 'lucide-react'
import type { DashboardSummary } from '@/types'
import { KpiCard } from '@/components/ui/KpiCard'
import { formatNumber, formatPercent } from '@/lib/format'

interface KpiRowProps {
  kpis: DashboardSummary['kpis']
}

export function KpiRow({ kpis }: KpiRowProps) {
  return (
    <div className="grid grid-cols-4 gap-6">
      <KpiCard
        icon={FileText}
        color="blue"
        label="総ルール数"
        value={formatNumber(kpis.totalRules)}
        caption="全体のルール数"
      />
      <KpiCard
        icon={ShieldCheck}
        color="green"
        label="有効ルール"
        value={formatNumber(kpis.activeRules)}
        caption={`有効化率 ${formatPercent(kpis.activeRate)}`}
      />
      <KpiCard
        icon={Hourglass}
        color="orange"
        label="承認待ち"
        value={formatNumber(kpis.pendingApproval)}
        caption="要確認のルール"
      />
      <KpiCard
        icon={FolderOpen}
        color="purple"
        label="カテゴリ数"
        value={formatNumber(kpis.categoryCount)}
        caption="管理カテゴリ数"
      />
    </div>
  )
}
