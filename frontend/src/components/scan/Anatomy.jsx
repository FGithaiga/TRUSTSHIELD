import { CircleCheck, CircleX, ScanText } from 'lucide-react'
import { cx } from '@/lib/format'

/** Compares a pasted confirmation with the usual layout of genuine SMS messages. */
export function Anatomy({ anatomy }) {
  const all = anatomy.passed === anatomy.total
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h3 className="flex items-center gap-2 font-bold text-fg">
          <ScanText className="size-[18px] text-brand-ink" /> SMS message anatomy
        </h3>
        <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-bold', all ? 'bg-risk-clear-bg text-risk-clear-fg' : 'bg-risk-high-bg text-risk-high-fg')}>
          {anatomy.passed} of {anatomy.total} match
        </span>
      </div>
      <ul className="divide-y divide-line">
        {anatomy.checks.map((c, i) => {
          const Icon = c.ok ? CircleCheck : CircleX
          return (
            <li key={c.key} className="flex animate-fade-up gap-3 px-5 py-3" style={{ animationDelay: `${i * 80}ms` }}>
              <Icon className={cx('mt-0.5 size-5 shrink-0', c.ok ? 'text-risk-clear-fg' : 'text-risk-high-fg')} />
              <div>
                <p className="text-sm font-semibold text-fg">{c.label}</p>
                <p className="text-[13px] leading-snug text-slate-500">{c.detail}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="border-t border-line bg-canvas/60 px-5 py-3 text-[13px] leading-snug text-slate-600">{anatomy.note}</p>
    </div>
  )
}
