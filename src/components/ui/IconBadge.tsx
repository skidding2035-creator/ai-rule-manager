import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import type { AccentColor } from '@/types'
import { iconBadgeClasses } from '@/lib/colors'

interface IconBadgeProps {
  icon: LucideIcon
  color: AccentColor
  size?: 'sm' | 'md' | 'lg'
}

const containerSize: Record<NonNullable<IconBadgeProps['size']>, string> = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
}

const iconSize: Record<NonNullable<IconBadgeProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}

export function IconBadge({ icon: Icon, color, size = 'md' }: IconBadgeProps) {
  return (
    <div className={clsx('inline-flex items-center justify-center rounded-xl', iconBadgeClasses[color], containerSize[size])}>
      <Icon className={iconSize[size]} />
    </div>
  )
}
