import { cx } from '@/lib/format'
import { RISK, SCAN_TYPES } from '@/lib/constants'

export function RiskBadge({ level, size = 'md', className }) {
  const r = RISK[level] ?? RISK.clear
  const Icon = r.icon
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap',
        r.bg, r.border, r.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-[13px]',
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} />
      {r.short}
    </span>
  )
}

export function TypeBadge({ type }) {
  const t = SCAN_TYPES[type]
  if (!t) return null
  const Icon = t.icon
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
      <Icon className="size-3.5" />
      {t.short}
    </span>
  )
}

export function Pill({ children, className, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-50 text-brand-ink',
    amber: 'bg-risk-caution-bg text-risk-caution-fg',
    green: 'bg-risk-clear-bg text-risk-clear-fg',
    red: 'bg-risk-high-bg text-risk-high-fg',
  }
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>
}

export function Skeleton({ className }) {
  return <div className={cx('animate-shimmer rounded-lg bg-slate-200/70', className)} />
}

export function SectionHeader({ title, description, action, className }) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl border border-line bg-canvas">
          <Icon className="size-6 text-slate-500" />
        </div>
      )}
      <p className="font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Segmented({ value, onChange, options, className }) {
  return (
    <div className={cx('inline-flex rounded-xl border border-line bg-canvas p-1', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 focus-visible:shadow-glow',
            value === o.value ? 'bg-surface text-fg shadow-card' : 'text-slate-500 hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
