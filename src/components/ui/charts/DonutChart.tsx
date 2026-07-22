import type { AccentColor } from '@/types'
import { accentHex } from '@/lib/colors'

interface DonutChartSlice {
  id: string
  color: AccentColor
  percentage: number
}

interface DonutChartProps {
  data: DonutChartSlice[]
  size?: number
  strokeWidth?: number
}

export function DonutChart({ data, size = 160, strokeWidth = 22 }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let cumulativePercent = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((slice) => {
          const dash = (slice.percentage / 100) * circumference
          const gap = circumference - dash
          const offset = -((cumulativePercent / 100) * circumference)
          cumulativePercent += slice.percentage
          return (
            <circle
              key={slice.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={accentHex[slice.color]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          )
        })}
      </g>
    </svg>
  )
}
