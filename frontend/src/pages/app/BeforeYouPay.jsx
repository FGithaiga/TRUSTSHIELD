import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CircleAlert, CircleCheckBig, RotateCcw, LifeBuoy } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { PAYMENT_SCENARIOS } from '@/data/checklists'
import { cx } from '@/lib/format'

export default function BeforeYouPay() {
  const [scenarioId, setScenarioId] = useState(PAYMENT_SCENARIOS[0].id)
  const [done, setDone] = useState({})
  const [flags, setFlags] = useState({})
  const scenario = PAYMENT_SCENARIOS.find((s) => s.id === scenarioId)

  const doneCount = scenario.steps.filter((_, i) => done[`${scenarioId}:${i}`]).length
  const progress = Math.round((doneCount / scenario.steps.length) * 100)
  const raised = useMemo(() => scenario.redFlags.filter((f) => flags[`${scenarioId}:${f}`]), [scenario, flags, scenarioId])

  const toggleStep = (i) => setDone((d) => ({ ...d, [`${scenarioId}:${i}`]: !d[`${scenarioId}:${i}`] }))
  const toggleFlag = (f) => setFlags((d) => ({ ...d, [`${scenarioId}:${f}`]: !d[`${scenarioId}:${f}`] }))
  const reset = () => {
    setDone((d) => Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith(`${scenarioId}:`))))
    setFlags((d) => Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith(`${scenarioId}:`))))
  }

  const verdict = raised.length ? 'stop' : progress === 100 ? 'ready' : 'pending'

  return (
    <>
      <PageHeader title="Before You Pay" description="A one-minute checklist that can save you money." />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        {/* Scenario picker */}
        <div className="space-y-2.5" role="radiogroup" aria-label="Payment type">
          {PAYMENT_SCENARIOS.map((s) => {
            const Icon = s.icon
            const active = s.id === scenarioId
            return (
              <button
                key={s.id}
                role="radio"
                aria-checked={active}
                onClick={() => setScenarioId(s.id)}
                className={cx(
                  'flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-150 focus-visible:shadow-glow',
                  active ? 'border-brand-500 bg-surface shadow-[0_0_0_4px_rgb(40_104_215/0.1)]' : 'border-line bg-surface hover:border-line-strong hover:shadow-card',
                )}
              >
                <span className={cx('grid size-11 shrink-0 place-items-center rounded-xl transition-colors', active ? 'bg-brand-600 text-white' : 'bg-canvas text-slate-600')}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-fg">{s.title}</span>
                  <span className="block text-[13px] leading-snug text-slate-500">{s.text}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div key={scenarioId} className="animate-fade-up space-y-5">
          {/* Red flags */}
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Do any of these apply?</h2>
            <p className="mb-4 text-sm text-slate-500">Select every statement that is true for this payment.</p>
            <div className="flex flex-wrap gap-2">
              {scenario.redFlags.map((f) => {
                const on = flags[`${scenarioId}:${f}`]
                return (
                  <button
                    key={f}
                    onClick={() => toggleFlag(f)}
                    aria-pressed={!!on}
                    className={cx(
                      'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-150 focus-visible:shadow-glow',
                      on ? 'border-risk-high bg-risk-high-bg text-risk-high-fg' : 'border-line-strong bg-surface text-slate-700 hover:border-slate-400',
                    )}
                  >
                    <span className={cx('grid size-4 place-items-center rounded-full border', on ? 'border-risk-high bg-risk-high text-white' : 'border-slate-400')}>
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    {f}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Checklist */}
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
              <div>
                <h2 className="text-lg font-bold">Checklist</h2>
                <p className="text-sm text-slate-500">{doneCount} of {scenario.steps.length} complete</p>
              </div>
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={reset}>Reset</Button>
            </div>
            <div className="mx-5 mt-4 h-2 overflow-hidden rounded-full bg-canvas sm:mx-6">
              <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {scenario.steps.map((step, i) => {
                const checked = !!done[`${scenarioId}:${i}`]
                return (
                  <li key={step}>
                    <button onClick={() => toggleStep(i)} aria-pressed={checked} className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-canvas/60 focus-visible:bg-canvas sm:px-6">
                      <span className={cx('mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-all duration-200', checked ? 'scale-105 border-brand-600 bg-brand-600 text-white' : 'border-line-strong')}>
                        {checked && <Check className="size-4 animate-scale-in" strokeWidth={3} />}
                      </span>
                      <span className={cx('text-[15px] leading-relaxed transition-colors', checked ? 'text-slate-400 line-through decoration-slate-300' : 'text-fg')}>{step}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Verdict */}
          <div
            className={cx(
              'flex flex-wrap items-center gap-4 rounded-2xl border p-5 transition-colors duration-300',
              verdict === 'stop' ? 'border-risk-high-line bg-risk-high-bg' : verdict === 'ready' ? 'border-risk-clear-line bg-risk-clear-bg' : 'border-line bg-surface',
            )}
            aria-live="polite"
          >
            {verdict === 'stop' ? <CircleAlert className="size-8 shrink-0 text-risk-high-fg" /> : <CircleCheckBig className={cx('size-8 shrink-0', verdict === 'ready' ? 'text-risk-clear-fg' : 'text-slate-300')} />}
            <div className="min-w-0 flex-1">
              <p className={cx('font-bold', verdict === 'stop' ? 'text-risk-high-fg' : verdict === 'ready' ? 'text-risk-clear-fg' : 'text-fg')}>
                {verdict === 'stop' ? 'Stop. Do not pay yet.' : verdict === 'ready' ? 'Checklist complete' : 'Work through the checklist'}
              </p>
              <p className="text-sm text-slate-600">
                {verdict === 'stop'
                  ? `You selected ${raised.length} warning sign${raised.length > 1 ? 's' : ''}. Verify independently before sending any money.`
                  : verdict === 'ready'
                    ? 'You have covered the key checks. Completing them lowers your risk, but it is not a guarantee.'
                    : 'Tick each step once you have done it.'}
              </p>
            </div>
            {verdict === 'stop' && <Button as={Link} to="/app/incidents" variant="secondary" size="sm" icon={LifeBuoy}>Already paid?</Button>}
          </div>
        </div>
      </div>
    </>
  )
}
