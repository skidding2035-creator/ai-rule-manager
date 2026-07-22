import type { AccentColor, RuleStatus, RulePriority, AIPlatformId } from '@/types'

// Tailwind's JIT scanner only detects literal class strings in source, so every
// accent color must be spelled out here rather than built via string interpolation.

export const accentHex: Record<AccentColor, string> = {
  blue: '#3B82F6',
  green: '#22C55E',
  orange: '#F59E0B',
  purple: '#A855F7',
  teal: '#14B8A6',
  red: '#EF4444',
  gray: '#6B7280',
}

export const iconBadgeClasses: Record<AccentColor, string> = {
  blue: 'bg-accent-blue/15 text-accent-blue',
  green: 'bg-accent-green/15 text-accent-green',
  orange: 'bg-accent-orange/15 text-accent-orange',
  purple: 'bg-accent-purple/15 text-accent-purple',
  teal: 'bg-accent-teal/15 text-accent-teal',
  red: 'bg-accent-red/15 text-accent-red',
  gray: 'bg-accent-gray/15 text-accent-gray',
}

export const dotClasses: Record<AccentColor, string> = {
  blue: 'bg-accent-blue',
  green: 'bg-accent-green',
  orange: 'bg-accent-orange',
  purple: 'bg-accent-purple',
  teal: 'bg-accent-teal',
  red: 'bg-accent-red',
  gray: 'bg-accent-gray',
}

export const textClasses: Record<AccentColor, string> = {
  blue: 'text-accent-blue',
  green: 'text-accent-green',
  orange: 'text-accent-orange',
  purple: 'text-accent-purple',
  teal: 'text-accent-teal',
  red: 'text-accent-red',
  gray: 'text-accent-gray',
}

export const statusPillClasses: Record<RuleStatus, string> = {
  active: 'bg-accent-green/15 text-accent-green',
  draft: 'bg-accent-gray/15 text-accent-gray',
  pending_approval: 'bg-accent-blue/15 text-accent-blue',
  stopped: 'bg-accent-orange/15 text-accent-orange',
  rejected: 'bg-accent-red/15 text-accent-red',
}

export const statusLabels: Record<RuleStatus, string> = {
  active: '有効',
  draft: 'ドラフト',
  pending_approval: '承認待ち',
  stopped: '停止',
  rejected: '却下',
}

export const statusAccentColor: Record<RuleStatus, AccentColor> = {
  active: 'green',
  draft: 'gray',
  pending_approval: 'blue',
  stopped: 'orange',
  rejected: 'red',
}

export const priorityPillClasses: Record<RulePriority, string> = {
  high: 'bg-accent-red/15 text-accent-red',
  medium: 'bg-accent-blue/15 text-accent-blue',
  low: 'bg-accent-gray/15 text-accent-gray',
}

export const priorityLabels: Record<RulePriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export const aiPlatformLabels: Record<AIPlatformId, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  copilot: 'Copilot',
  common: '共通',
}
