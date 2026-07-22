import type { StatusHistoryEntry } from '@/types'
import { Card } from '@/components/ui/Card'
import { FooterLink } from '@/components/ui/FooterLink'
import { StatusPill } from '@/components/ui/StatusPill'
import { Table, type TableColumn } from '@/components/ui/Table'

interface StatusHistoryCardProps {
  entries: StatusHistoryEntry[]
}

const columns: TableColumn<StatusHistoryEntry>[] = [
  { key: 'timestamp', header: '日時', render: (row) => row.timestamp },
  { key: 'status', header: 'ステータス', render: (row) => <StatusPill status={row.status} /> },
  { key: 'ruleName', header: 'ルール名', render: (row) => row.ruleName },
  { key: 'category', header: 'カテゴリ', render: (row) => row.category },
  { key: 'changedBy', header: '変更者', render: (row) => row.changedBy },
  { key: 'comment', header: '理由・コメント', render: (row) => row.comment },
]

export function StatusHistoryCard({ entries }: StatusHistoryCardProps) {
  return (
    <Card
      className="col-span-2"
      title="ステータス履歴（最新）"
      headerAction={<FooterLink to="/history" label="すべての履歴を見る" />}
    >
      <Table columns={columns} rows={entries} rowKey={(row) => row.id} />
    </Card>
  )
}
