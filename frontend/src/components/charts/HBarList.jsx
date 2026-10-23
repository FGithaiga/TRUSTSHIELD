import { useEffect, useState } from 'react'

/** Single-series horizontal bars with the value at the tip. */
export function HBarList({ items, color = 'var(--color-brand-600)', emptyText = 'No data yet.' }) {
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const max = Math.max(1, ...items.map((i) => i.value))
  if (!items.length || items.every((i) => i.value === 0)) return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>

  return (
    <ul className="space-y-3.5">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.label} className="group" title={`${item.label}: ${item.value}`}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
                {Icon && <Icon className="size-4 shrink-0 text-slate-500" />}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="tabular font-semibold text-fg">{item.value}</span>
            </div>
            <div className="h-2.5 w-full rounded-r bg-transparent">
              <div
                className="h-full rounded-r-[4px] transition-[width,opacity] duration-700 ease-out group-hover:opacity-80"
                style={{ width: grown ? `${Math.max(2, (item.value / max) * 100)}%` : '0%', background: color }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
