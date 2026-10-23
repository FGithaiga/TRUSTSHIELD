import { useEffect, useState } from 'react'
import { RISK } from '@/lib/constants'

export function ScoreRing({ score, level, size = 76 }) {
  const [shown, setShown] = useState(0)
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score))
    return () => cancelAnimationFrame(id)
  }, [score])

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Risk score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--color-line)' }} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (shown / 100) * c}
          style={{ stroke: RISK[level].dot, transition: 'stroke-dashoffset 1s cubic-bezier(0.2,0.7,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[22px] leading-none font-bold text-fg">{score}</p>
          <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">of 100</p>
        </div>
      </div>
    </div>
  )
}
