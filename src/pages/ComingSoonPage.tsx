import { Construction } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'

interface ComingSoonPageProps {
  title: string
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div className="pb-8">
      <TopBar title={title} />
      <div className="px-8 pt-6">
        <Card className="items-center justify-center py-20 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
              <Construction className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold text-gray-100">{title}（準備中）</p>
            <p className="max-w-sm text-sm text-gray-500">
              この画面は次のセッションで実装予定です。しばらくお待ちください。
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
