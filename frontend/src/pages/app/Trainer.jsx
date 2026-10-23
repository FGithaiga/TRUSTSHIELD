import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, ShieldAlert, ShieldCheck, ArrowRight, RotateCcw, Flame, Target, Award, Cpu, Lock, CircleCheck, CircleX, ScanSearch,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { RiskBadge, Skeleton } from '@/components/ui/Misc'
import { api } from '@/lib/api'
import { OFFER_TYPES } from '@/lib/constants'
import { cx } from '@/lib/format'
import { useToast } from '@/context/ToastContext'

const SOURCE = { rule: 'Rule', model: 'ML model', url: 'Link check', community: 'Community' }

function StatsStrip({ stats }) {
  if (!stats) return <Skeleton className="mb-6 h-[104px] rounded-2xl" />
  const next = stats.next_level
  const items = [
    { icon: Award, label: 'Level', value: stats.level },
    { icon: Target, label: 'Accuracy', value: stats.answered ? `${stats.accuracy}%` : '--' },
    { icon: GraduationCap, label: 'Answered', value: stats.answered },
    { icon: Flame, label: 'Day streak', value: stats.streak_days },
  ]
  return (
    <div className="dot-grid mb-6 rounded-2xl bg-ink-900 p-5 text-white">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-800"><Icon className="size-5 text-mint-300" /></span>
            <div>
              <p className="text-xs font-medium text-mist-400">{label}</p>
              <p className="text-lg leading-tight font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>
      {next && (
        <p className="mt-4 border-t border-white/10 pt-3 text-[13px] text-mist-300">
          Next level: <span className="font-semibold text-white">{next.name}</span>
          {next.answers_needed > 0 && <> &middot; answer {next.answers_needed} more</>} &middot; keep accuracy at {next.accuracy_needed}% or higher
        </p>
      )}
    </div>
  )
}

function ChallengeView({ challenge }) {
  if (challenge.scan_type === 'mpesa') {
    return (
      <div className="mx-auto w-full max-w-md rounded-[28px] border-[8px] border-ink-950 bg-canvas shadow-lift">
        <div className="rounded-t-[20px] border-b border-line bg-surface px-4 py-2.5 text-center">
          <p className="text-[13px] font-bold text-fg">Text message</p>
          <p className="text-[11px] text-slate-500">Today</p>
        </div>
        <div className="p-4 pb-8">
          <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface p-3.5 text-[14.5px] leading-relaxed text-fg shadow-sm">{challenge.text}</div>
        </div>
      </div>
    )
  }
  if (challenge.scan_type === 'url') {
    return (
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-lift">
        <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-4 py-3">
          {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-line-strong" />)}
        </div>
        <div className="p-5">
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Someone sent you this link</p>
          <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-canvas px-3.5 py-3">
            <Lock className="size-4 shrink-0 text-slate-400" />
            <span className="font-mono text-[14.5px] break-all text-fg">{challenge.text}</span>
          </div>
        </div>
      </div>
    )
  }
  const type = OFFER_TYPES.find((o) => o.value === challenge.offer_type)?.label ?? 'Offer'
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-line-strong bg-surface p-5 shadow-lift">
      <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-ink">{type}</span>
      <p className="mt-3 text-[15px] leading-relaxed text-fg">{challenge.text}</p>
    </div>
  )
}

function Reveal({ reveal, onNext, last }) {
  const a = reveal.analysis
  return (
    <div className="animate-fade-up space-y-4">
      <div className={cx('flex items-start gap-3 rounded-2xl border p-4', reveal.correct ? 'border-risk-clear-line bg-risk-clear-bg' : 'border-risk-high-line bg-risk-high-bg')}>
        {reveal.correct ? <CircleCheck className="mt-0.5 size-6 shrink-0 text-risk-clear-fg" /> : <CircleX className="mt-0.5 size-6 shrink-0 text-risk-high-fg" />}
        <div>
          <p className={cx('font-bold', reveal.correct ? 'text-risk-clear-fg' : 'text-risk-high-fg')}>
            {reveal.correct ? 'Well spotted.' : 'Not quite.'} This one is {reveal.answer === 'scam' ? 'a scam' : 'safe'}.
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{reveal.lesson}</p>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-bold text-fg"><Cpu className="size-[18px] text-brand-ink" /> What TrustShield noticed</p>
          <div className="flex items-center gap-2">
            <RiskBadge level={a.risk_level} size="sm" />
            <span className="text-sm font-semibold text-slate-600">{a.risk_score}/100</span>
          </div>
        </div>
        {a.findings.length ? (
          <ul className="space-y-1.5">
            {a.findings.map((f) => (
              <li key={f.title} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className={cx('size-2 shrink-0 rounded-full', f.severity === 'high' ? 'bg-risk-high' : f.severity === 'medium' ? 'bg-risk-caution-dot' : 'bg-slate-400')} />
                <span className="flex-1">{f.title}</span>
                <span className="text-xs text-slate-400">{SOURCE[f.source] ?? 'Check'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">No warning signs found by the rules or link checks.</p>
        )}
        {a.model && (
          <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[13px] text-slate-600">
            ML model ({a.model.model.replace('_', ' ')}): <span className="font-semibold text-fg">{a.model.label}</span>
          </p>
        )}
        {!reveal.trustshield_agrees && (
          <p className="mt-3 text-[13px] text-slate-500">TrustShield rated this one differently. Automated checks can miss things, which is why your own judgement matters.</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} iconRight={ArrowRight}>{last ? 'See my score' : 'Next message'}</Button>
      </div>
    </div>
  )
}

export default function Trainer() {
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [round, setRound] = useState(null)
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState([])
  const [reveal, setReveal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('intro')

  useEffect(() => {
    api.trainer.stats().then(setStats).catch((e) => toast(e.message, { type: 'error' }))
  }, [toast])

  const start = async () => {
    setBusy(true)
    try {
      const data = await api.trainer.round()
      setRound(data.challenges)
      setStats(data.stats)
      setIndex(0)
      setResults([])
      setReveal(null)
      setPhase('playing')
    } catch (e) {
      toast(e.message, { type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const submit = useCallback(async (answer) => {
    if (busy || reveal || phase !== 'playing') return
    setBusy(true)
    try {
      const data = await api.trainer.answer({ challenge_id: round[index].id, answer })
      setReveal(data)
      setStats(data.stats)
      setResults((r) => [...r, data.correct])
    } catch (e) {
      toast(e.message, { type: 'error' })
    } finally {
      setBusy(false)
    }
  }, [busy, reveal, phase, round, index, toast])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea')) return
      if (e.key.toLowerCase() === 's') submit('safe')
      if (e.key.toLowerCase() === 'x') submit('scam')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submit])

  const next = () => {
    setReveal(null)
    if (index + 1 >= round.length) setPhase('summary')
    else setIndex((i) => i + 1)
  }

  const score = results.filter(Boolean).length

  return (
    <>
      <PageHeader title="Scam Sense Trainer" description="Safe or scam? Practise on fictional messages." />
      <StatsStrip stats={stats} />

      {phase === 'intro' && (
        <div className="card grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-xl font-bold">Five messages. One minute. Sharper instincts.</h2>
            <ul className="mt-4 space-y-2.5 text-[15px] text-slate-600">
              {['Read each message as if it reached your phone.', 'Tap Looks safe or It is a scam (keys S / X).', 'See what you and TrustShield spotted.'].map((t, i) => (
                <li key={t} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink-900 text-xs font-bold text-white">{i + 1}</span>{t}</li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-slate-500">All messages are fictional and stay out of your history.</p>
          </div>
          <Button size="lg" icon={GraduationCap} loading={busy} onClick={start}>Start a round</Button>
        </div>
      )}

      {phase === 'playing' && round && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1.5" aria-label={`Message ${index + 1} of ${round.length}`}>
              {round.map((c, i) => (
                <span key={c.id} className={cx('h-2 flex-1 rounded-full transition-colors duration-300', i < results.length ? (results[i] ? 'bg-risk-clear' : 'bg-risk-high') : i === index ? 'bg-brand-600' : 'bg-line')} />
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-600">{index + 1} / {round.length}</span>
          </div>

          <div key={round[index].id} className="animate-fade-up">
            <ChallengeView challenge={round[index]} />
          </div>

          {!reveal ? (
            <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
              <button
                onClick={() => submit('safe')}
                disabled={busy}
                className="flex h-16 items-center justify-center gap-2.5 rounded-2xl border-2 border-risk-clear bg-surface text-[16px] font-bold text-risk-clear-fg transition-all duration-150 hover:bg-risk-clear-bg focus-visible:shadow-glow active:scale-[0.98] disabled:opacity-60"
              >
                <ShieldCheck className="size-5" /> Looks safe
              </button>
              <button
                onClick={() => submit('scam')}
                disabled={busy}
                className="flex h-16 items-center justify-center gap-2.5 rounded-2xl border-2 border-risk-high bg-risk-high text-[16px] font-bold text-white transition-all duration-150 hover:bg-risk-high-hover focus-visible:shadow-glow-danger active:scale-[0.98] disabled:opacity-60"
              >
                <ShieldAlert className="size-5" /> It is a scam
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl"><Reveal reveal={reveal} onNext={next} last={index + 1 >= round.length} /></div>
          )}
        </div>
      )}

      {phase === 'summary' && (
        <div className="card mx-auto max-w-xl animate-scale-in p-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-ink-900"><Award className="size-8 text-mint-300" /></span>
          <p className="mt-5 text-sm font-semibold text-slate-500">Round complete</p>
          <p className="text-5xl font-extrabold tracking-tight text-fg">{score}<span className="text-2xl text-slate-400"> / {results.length}</span></p>
          <p className="mx-auto mt-3 max-w-sm text-[15px] text-slate-600">
            {score === results.length ? 'Perfect round. Scammers would have a hard time with you.' : score >= 3 ? 'Good instincts. Review the lessons on the ones you missed.' : 'Every round sharpens your eye. The warning signs repeat, so try another.'}
          </p>
          {stats && <p className="mt-4 text-sm text-slate-500">Level: <span className="font-semibold text-fg">{stats.level}</span> &middot; {stats.streak_days} day streak</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button icon={RotateCcw} loading={busy} onClick={start}>Play again</Button>
            <Button as={Link} to="/app/mpesa" variant="secondary" icon={ScanSearch}>Check a real message</Button>
          </div>
        </div>
      )}
    </>
  )
}
