import { useEffect, useState } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/Misc'
import { cx } from '@/lib/format'
import { CountUp } from '@/components/ui/Motion'

function Trend({ count, previous, dark }) {
  if (!previous) return <span className={cx('rounded px-1.5 py-0.5 text-[11px] font-bold', dark ? 'bg-mint-300/15 text-mint-300' : 'bg-brand-50 text-brand-ink')}>New</span>
  const change = count - previous
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  return (
    <span
      title={`${count} this week, ${previous} the week before`}
      className={cx('inline-flex items-center gap-1 text-xs font-semibold', change > 0 ? (dark ? 'text-coral-300' : 'text-risk-high-fg') : dark ? 'text-mist-400' : 'text-slate-500')}
    >
      <Icon className="size-3.5" /> {change > 0 ? '+' : ''}{change}
      <span className="sr-only"> compared with last week</span>
    </span>
  )
}

/** Anonymous, community-wide scam trends for the last 7 days. */
export function PulseCard({ dark = false, className }) {
  const [pulse, setPulse] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api.pulse().then(setPulse).catch(() => setFailed(true))
  }, [])

  if (failed) return null
  const max = Math.max(1, ...(pulse?.trending ?? []).map((t) => t.count))

  return (
    <div className={cx('rounded-2xl p-5', dark ? 'border border-white/10 bg-ink-800 text-white' : 'card', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={cx('flex items-center gap-2 text-[17px] font-bold', dark ? 'text-white' : 'text-fg')}>
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint-400 opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-mint-400" />
            </span>
            Scam Pulse
          </h2>
          <p className={cx('text-sm', dark ? 'text-mist-300' : 'text-slate-500')}>What people checked on TrustShield in the last 7 days</p>
        </div>
        <Activity className={cx('size-5', dark ? 'text-mint-300' : 'text-brand-ink')} />
      </div>

      {!pulse ? (
        <Skeleton className="mt-4 h-40" />
      ) : !pulse.enough_data || !pulse.trending.length ? (
        <p className={cx('mt-5 text-sm', dark ? 'text-mist-300' : 'text-slate-500')}>Not enough checks this week to show trends without risking anyone's privacy.</p>
      ) : (
        <>
          <div className="mt-4 flex gap-6">
            <div>
              <p className={cx('text-2xl font-bold', dark ? 'text-white' : 'text-fg')}><CountUp value={pulse.checks} /></p>
              <p className={cx('text-xs', dark ? 'text-mist-400' : 'text-slate-500')}>checks</p>
            </div>
            <div>
              <p className={cx('text-2xl font-bold', dark ? 'text-white' : 'text-fg')}><CountUp value={pulse.high_share} />%</p>
              <p className={cx('text-xs', dark ? 'text-mist-400' : 'text-slate-500')}>rated high risk</p>
            </div>
          </div>
          <p className={cx('mt-5 mb-2.5 flex justify-between text-xs font-semibold tracking-wide uppercase', dark ? 'text-mist-400' : 'text-slate-500')}>
            <span>Most reported this week</span>
            <span className="normal-case tracking-normal">change vs last week</span>
          </p>
          <ul className="space-y-3">
            {pulse.trending.map((t) => (
              <li key={t.category} title={`${t.category}: ${t.count} this week, ${t.previous} the week before`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className={cx('truncate font-medium', dark ? 'text-mist-100' : 'text-slate-700')}>{t.category}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Trend count={t.count} previous={t.previous} dark={dark} />
                    <span className={cx('tabular w-6 text-right font-semibold', dark ? 'text-white' : 'text-fg')}>{t.count}</span>
                  </span>
                </div>
                <div className="h-2 rounded-r-[4px]" style={{ width: `${Math.max(4, (t.count / max) * 100)}%`, background: dark ? '#69dfbd' : '#2868d7' }} />
              </li>
            ))}
          </ul>
          <p className={cx('mt-4 text-[11px]', dark ? 'text-mist-400' : 'text-slate-500')}>Anonymous totals. Groups too small to stay anonymous are hidden.</p>
        </>
      )}
    </div>
  )
}
