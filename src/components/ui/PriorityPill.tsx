import type { RulePriority } from '@/types'
import { priorityPillClasses, priorityLabels } from '@/lib/colors'
import { Pill } from './Pill'

interface PriorityPillProps {
  priority: RulePriority
}

export function PriorityPill({ priority }: PriorityPillProps) {
  return <Pill label={priorityLabels[priority]} colorClasses={priorityPillClasses[priority]} />
}
