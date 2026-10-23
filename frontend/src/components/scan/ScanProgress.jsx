import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cx } from '@/lib/format'

const STEPS = {
  mpesa: ['Validating message', 'Checking known scam patterns', 'Running SMS classifier', 'Preparing explanation'],
  url: ['Parsing link structure', 'Comparing with official domains', 'Running URL model', 'Preparing explanation'],
  offer: ['Validating offer text', 'Checking advance-fee patterns', 'Running offer classifier', 'Preparing explanation'],
}

export function ScanProgress({ scanType }) {
  const steps = STEPS[scanType]
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive((a) => Math.min(a + 1, steps.length - 1)), 260)
    return () => clearInterval(id)
  }, [steps.length])

  return (
    <div className="card animate-fade-up overflow-hidden" aria-live="polite" aria-busy="true">
      <div className="relative h-1 overflow-hidden bg-brand-50">
        <div className="absolute inset-y-0 w-1/3 animate-scan-line bg-brand-500" />
      </div>
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50">
          <Loader2 className="size-7 animate-spin text-brand-ink" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-fg">Analyzing</p>
          <p className="text-sm text-slate-500">Running rules, ML and link checks.</p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s} className={cx('flex items-center gap-2.5 text-sm transition-colors', i <= active ? 'text-fg' : 'text-slate-400')}>
                <span className={cx('grid size-5 place-items-center rounded-full border transition-all duration-300', i < active ? 'border-brand-600 bg-brand-600 text-white' : i === active ? 'border-brand-500 shadow-glow' : 'border-line-strong')}>
                  {i < active && <Check className="size-3" strokeWidth={3} />}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
