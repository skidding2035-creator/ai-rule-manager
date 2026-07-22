import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Bell, Plus } from 'lucide-react'
import type { DashboardSummary } from '@/types'
import { getRuleService } from '@/services/rules'
import { TopBar } from '@/components/layout/TopBar'
import { KpiRow } from '@/components/dashboard/KpiRow'
import { HeroQualityCard } from '@/components/dashboard/HeroQualityCard'
import { CategoryDonutCard } from '@/components/dashboard/CategoryDonutCard'
import { RecentUpdatesCard } from '@/components/dashboard/RecentUpdatesCard'
import { TodayActivityCard } from '@/components/dashboard/TodayActivityCard'
import { ApprovalFlowCard } from '@/components/dashboard/ApprovalFlowCard'
import { StatusHistoryCard } from '@/components/dashboard/StatusHistoryCard'
import { AnnouncementsCard } from '@/components/dashboard/AnnouncementsCard'
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard'

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    getRuleService()
      .getDashboardSummary()
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!summary) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <TopBar
        title="ダッシュボード"
        subtitle="AIルール運用の全体状況を一目で把握できます"
        right={
          <>
            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
              <RefreshCw className="h-4 w-4" />
              最終更新：{summary.lastUpdated}
            </button>
            <button className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-gray-200">
              <Bell className="h-5 w-5" />
            </button>
            <Link
              to="/rules/new"
              className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" />
              新規登録
            </Link>
          </>
        }
      />

      <div className="space-y-6 px-8 pt-6">
        <KpiRow kpis={summary.kpis} />

        <div className="grid grid-cols-4 gap-6">
          <HeroQualityCard qualityScore={summary.qualityScore} />
          <CategoryDonutCard categories={summary.categories} />
          <RecentUpdatesCard rules={summary.recentUpdates} categories={summary.categories} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <TodayActivityCard metrics={summary.todayActivity} />
          <ApprovalFlowCard steps={summary.approvalFlow} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <StatusHistoryCard entries={summary.statusHistory} />
          <AnnouncementsCard announcements={summary.announcements} />
        </div>

        <QuickActionsCard />
      </div>
    </div>
  )
}
