import { Fragment, useMemo } from 'react'

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Renders text with each evidence phrase marked so users can see why it was flagged. */
export function HighlightedText({ text, findings }) {
  const parts = useMemo(() => {
    const phrases = new Map()
    findings.forEach((f) => f.evidence?.forEach((e) => e && e.length > 1 && !phrases.has(e.toLowerCase()) && phrases.set(e.toLowerCase(), f.severity)))
    if (!phrases.size) return [{ text }]
    const re = new RegExp(`(${[...phrases.keys()].sort((a, b) => b.length - a.length).map(escape).join('|')})`, 'gi')
    return text.split(re).map((chunk) => ({ text: chunk, severity: phrases.get(chunk.toLowerCase()) }))
  }, [text, findings])

  const tone = {
    high: 'bg-risk-high/12 text-risk-high-fg decoration-risk-high/50',
    medium: 'bg-risk-caution-dot/20 text-risk-caution-fg decoration-risk-caution-dot',
    low: 'bg-brand-100 text-brand-ink decoration-brand-400',
  }

  return (
    <p className="text-[15px] leading-7 break-words whitespace-pre-wrap text-fg">
      {parts.map((p, i) =>
        p.severity ? (
          <mark key={i} className={`rounded px-0.5 font-semibold underline decoration-2 underline-offset-[3px] ${tone[p.severity]}`}>{p.text}</mark>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </p>
  )
}
