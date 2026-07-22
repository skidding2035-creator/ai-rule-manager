import type { ApprovalFlowStep } from '@/types'
import { Card } from '@/components/ui/Card'
import { FooterLink } from '@/components/ui/FooterLink'
import { Stepper } from '@/components/ui/Stepper'

interface ApprovalFlowCardProps {
  steps: ApprovalFlowStep[]
}

export function ApprovalFlowCard({ steps }: ApprovalFlowCardProps) {
  return (
    <Card
      title="ルール登録フロー（承認プロセス）"
      footer={<FooterLink to="/approvals" label="フローの詳細を見る" />}
      className="col-span-2"
      bodyClassName="flex items-center"
    >
      <Stepper steps={steps} />
    </Card>
  )
}
