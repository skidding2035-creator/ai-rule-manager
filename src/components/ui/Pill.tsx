import clsx from 'clsx'

interface PillProps {
  label: string
  colorClasses: string
  suffix?: string
}

export function Pill({ label, colorClasses, suffix }: PillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium',
        colorClasses,
      )}
    >
      {label}
      {suffix && <span className="opacity-70">({suffix})</span>}
    </span>
  )
}
