import type { RuleStatus } from '@/types'
import { statusPillClasses, statusLabels } from '@/lib/colors'
import { Pill } from './Pill'

interface StatusPillProps {
  status: RuleStatus
  version?: string
}

export function StatusPill({ status, version }: StatusPillProps) {
  return <Pill label={statusLabels[status]} colorClasses={statusPillClasses[status]} suffix={version} />
}
