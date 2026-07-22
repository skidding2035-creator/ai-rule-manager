import clsx from 'clsx'
import { Check } from 'lucide-react'
import type { ApprovalFlowStep } from '@/types'

interface StepperProps {
  steps: ApprovalFlowStep[]
}

const circleClasses: Record<ApprovalFlowStep['state'], string> = {
  done: 'bg-accent-green text-background',
  current: 'bg-accent-blue text-white',
  upcoming: 'border border-border bg-background text-gray-500',
}

const connectorClasses: Record<ApprovalFlowStep['state'], string> = {
  done: 'bg-accent-green',
  current: 'bg-accent-blue',
  upcoming: 'bg-border',
}

export function Stepper({ steps }: StepperProps) {
  return (
    <div className="flex w-full items-start py-2">
      {steps.map((step, i) => (
        <div key={step.step} className="flex flex-1 items-start last:flex-none">
          <div className="flex min-w-[112px] flex-col items-center gap-3 text-center">
            <div
              className={clsx(
                'flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold',
                circleClasses[step.state],
              )}
            >
              {step.state === 'done' ? <Check className="h-7 w-7" /> : step.step}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{step.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{step.meta}</p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex h-16 flex-1 items-center px-1">
              <div className={clsx('h-[3px] w-full rounded-full', connectorClasses[step.state])} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
