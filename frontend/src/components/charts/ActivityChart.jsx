import { useMemo, useState } from 'react'
import { RISK } from '@/lib/constants'
import { formatShortDay } from '@/lib/format'
import { useSize } from './useSize'

// Stacked from the baseline up: the most important state sits on the axis.
const SERIES = ['high', 'caution', 'clear']
const PAD = { top: 12, right: 8, bottom: 28, left: 32 }
const GAP = 2

function niceMax(v) {
  if (v <= 4) return 4
  const step = Math.ceil(v / 4)
  return step * 4
}

/** Top-rounded rect path (4px data-end, square at the baseline). */
function topRounded(x, y, w, h, r) {
  const rr = Math.min(r, h, w / 2)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

export function ActivityChart({ data }) {
  const [ref, { width, height }] = useSize()
  const HEIGHT = Math.max(220, height)
  const [hover, setHover] = useState(null)

  const max = useMemo(() => niceMax(Math.max(1, ...data.map((d) => d.high + d.caution + d.clear))), [data])
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const band = data.length ? innerW / data.length : 0
  const barW = Math.max(3, Math.min(24, band * 0.62))
  const y = (v) => (v / max) * innerH
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max]
  const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(innerW / 64)))

  return (
    <div ref={ref} className="relative h-full min-h-[220px] w-full select-none" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} className="absolute inset-0" role="img" aria-label="Scans per day, stacked by risk level">
          {ticks.map((t) => (
            <g key={t} transform={`translate(0, ${PAD.top + innerH - y(t)})`}>
              <line x1={PAD.left} x2={width - PAD.right} style={{ stroke: t === 0 ? 'var(--color-line-strong)' : 'var(--color-line)' }} strokeWidth="1" />
              <text x={PAD.left - 8} dy="0.32em" textAnchor="end" className="tabular fill-slate-400 text-[11px]">{t}</text>
            </g>
          ))}

          {data.map((d, i) => {
            const cx = PAD.left + band * i + band / 2
            let base = PAD.top + innerH
            const active = hover === i
            const segments = SERIES.filter((k) => d[k] > 0)
            return (
              <g key={d.date} opacity={hover === null || active ? 1 : 0.45} style={{ transition: 'opacity 150ms' }}>
                {segments.map((k, si) => {
                  const h = y(d[k])
                  const top = si === segments.length - 1
                  const gap = si > 0 ? GAP : 0
                  const yTop = base - h
                  const node = top ? (
                    <path key={k} d={topRounded(cx - barW / 2, yTop + gap, barW, Math.max(0, h - gap), 4)} style={{ fill: RISK[k].dot }} />
                  ) : (
                    <rect key={k} x={cx - barW / 2} y={yTop + gap} width={barW} height={Math.max(0, h - gap)} style={{ fill: RISK[k].dot }} />
                  )
                  base = yTop
                  return node
                })}
                {i % labelEvery === 0 && (
                  <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">{formatShortDay(d.date)}</text>
                )}
                {/* Hit target spans the full band, larger than the mark */}
                <rect x={cx - band / 2} y={PAD.top} width={band} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
              </g>
            )
          })}
        </svg>
      )}

      {hover !== null && data[hover] && (
        <Tooltip d={data[hover]} left={Math.min(Math.max(PAD.left + band * hover + band / 2, 90), width - 90)} />
      )}
    </div>
  )
}

function Tooltip({ d, left }) {
  const total = d.high + d.caution + d.clear
  return (
    <div className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 animate-fade-in rounded-xl border border-line bg-surface p-3 text-[13px] shadow-lift" style={{ left }}>
      <p className="mb-2 font-semibold text-fg">{formatShortDay(d.date)}</p>
      {SERIES.map((k) => (
        <div key={k} className="flex items-center justify-between gap-3 py-0.5">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="size-2.5 rounded-sm" style={{ background: RISK[k].dot }} />
            {RISK[k].short}
          </span>
          <span className="tabular font-semibold text-fg">{d[k]}</span>
        </div>
      ))}
      <div className="mt-1.5 flex justify-between border-t border-line pt-1.5 text-slate-500">
        <span>Total</span>
        <span className="tabular font-semibold text-fg">{total}</span>
      </div>
    </div>
  )
}

export function ActivityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {SERIES.map((k) => {
        const Icon = RISK[k].icon
        return (
          <span key={k} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
            <span className="size-2.5 rounded-sm" style={{ background: RISK[k].dot }} />
            <Icon className="size-3.5 text-slate-500" />
            {RISK[k].short}
          </span>
        )
      })}
    </div>
  )
}

export function ActivityTable({ data }) {
  return (
    <div className="max-h-[260px] overflow-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-canvas text-left text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-3 py-2">Date</th>
            {SERIES.map((k) => <th key={k} className="px-3 py-2 text-right">{RISK[k].short}</th>)}
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="tabular divide-y divide-line">
          {[...data].reverse().map((d) => (
            <tr key={d.date}>
              <td className="px-3 py-1.5 text-slate-600">{formatShortDay(d.date)}</td>
              {SERIES.map((k) => <td key={k} className="px-3 py-1.5 text-right">{d[k]}</td>)}
              <td className="px-3 py-1.5 text-right font-semibold">{d.high + d.caution + d.clear}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
