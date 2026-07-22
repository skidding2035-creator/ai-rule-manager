import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FooterLinkProps {
  to: string
  label: string
}

export function FooterLink({ to, label }: FooterLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-colors hover:text-blue-400"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}
