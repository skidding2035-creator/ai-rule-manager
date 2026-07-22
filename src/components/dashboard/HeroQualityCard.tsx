import { ArrowRight } from 'lucide-react'
import type { QualityScore } from '@/types'
import heroVisual from '@/assets/images/hero-quality-visual.png'

interface HeroQualityCardProps {
  qualityScore: QualityScore
}

export function HeroQualityCard({ qualityScore }: HeroQualityCardProps) {
  return (
    <div
      className="relative col-span-2 flex h-[340px] flex-col overflow-hidden rounded-2xl border border-border p-8"
      style={{
        backgroundImage: `url(${heroVisual})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 15%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      <div className="relative flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">AIルール運用状況</h3>
          <p className="mt-2 max-w-md text-sm text-gray-400">
            品質の高いAI運用を継続的に実現し、ミスを減らし、再発を防ぎます。
          </p>
        </div>
        <p className="whitespace-nowrap text-sm text-gray-400">
          今週の改善 <span className="font-semibold text-accent-green">+{qualityScore.weeklyImprovementCount}件</span>
        </p>
      </div>

      <div className="relative mt-6">
        <p className="text-sm text-gray-400">AI運用品質スコア</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="text-6xl font-bold text-white">{qualityScore.score}%</span>
          <span className="mb-2 rounded-full bg-accent-green/15 px-3 py-1 text-sm font-medium text-accent-green">
            {qualityScore.label}
          </span>
        </div>
        <button className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white">
          スコアの詳細を見る
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
