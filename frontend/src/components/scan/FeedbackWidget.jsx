import { useState } from 'react'
import { ThumbsUp, ThumbsDown, HeartHandshake } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { cx } from '@/lib/format'
import { Button } from '@/components/ui/Button'

const ACTUAL = [
  { value: 'scam', label: 'It was a scam' },
  { value: 'legit', label: 'It was genuine' },
  { value: 'unsure', label: 'Not sure' },
]

/** "Was this right?" Labels are exported for the ML team to evaluate and retrain models. */
export function FeedbackWidget({ result }) {
  const toast = useToast()
  const [fb, setFb] = useState(result.feedback ?? null)
  const [draft, setDraft] = useState(() => ({ verdict: result.feedback?.verdict ?? null, actual: result.feedback?.actual ?? 'unsure', comment: result.feedback?.comment ?? '' }))
  const [editing, setEditing] = useState(!result.feedback)
  const [saving, setSaving] = useState(false)

  if (!result.id) return null

  const save = async (next = draft) => {
    setSaving(true)
    try {
      const saved = await api.scans.feedback(result.id, next)
      setFb(saved)
      setEditing(false)
      toast('Thank you. Your answer helps the team measure and improve the models.', { type: 'success', title: 'Feedback saved' })
    } catch (e) {
      toast(e.message, { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (fb && !editing) {
    return (
      <div className="card flex flex-wrap items-center gap-3 p-4 sm:px-5">
        <HeartHandshake className="size-5 text-risk-clear-fg" />
        <p className="flex-1 text-sm text-slate-700">
          Thanks for your feedback. You said the assessment was <span className="font-semibold">{fb.verdict === 'agree' ? 'right' : 'wrong'}</span>
          {fb.actual !== 'unsure' && <> and {fb.actual === 'scam' ? 'it was a scam' : 'it was genuine'}</>}.
        </p>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Change</Button>
      </div>
    )
  }

  const choose = (verdict) => setDraft((d) => ({ ...d, verdict }))
  const thumb = 'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-150 focus-visible:shadow-glow active:scale-[0.97]'

  return (
    <div className="card p-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 font-bold text-fg">Was this assessment right?</p>
        <button onClick={() => choose('agree')} aria-pressed={draft.verdict === 'agree'} className={cx(thumb, draft.verdict === 'agree' ? 'border-risk-clear bg-risk-clear-bg text-risk-clear-fg' : 'border-line-strong text-slate-700 hover:bg-slate-50')}>
          <ThumbsUp className="size-4" /> Yes
        </button>
        <button onClick={() => choose('disagree')} aria-pressed={draft.verdict === 'disagree'} className={cx(thumb, draft.verdict === 'disagree' ? 'border-risk-high bg-risk-high-bg text-risk-high-fg' : 'border-line-strong text-slate-700 hover:bg-slate-50')}>
          <ThumbsDown className="size-4" /> No
        </button>
      </div>
      {draft.verdict && (
        <div className="mt-4 animate-fade-up space-y-3 border-t border-line pt-4">
          <p className="text-sm font-semibold text-fg">If you know, what was it really?</p>
          <div className="flex flex-wrap gap-2">
            {ACTUAL.map((a) => (
              <button
                key={a.value}
                onClick={() => setDraft((d) => ({ ...d, actual: a.value }))}
                aria-pressed={draft.actual === a.value}
                className={cx('rounded-full border px-3 py-1 text-[13px] font-semibold transition', draft.actual === a.value ? 'border-brand-500 bg-brand-50 text-brand-ink' : 'border-line-strong text-slate-600 hover:border-brand-400')}
              >
                {a.label}
              </button>
            ))}
          </div>
          <input
            value={draft.comment}
            onChange={(e) => setDraft((d) => ({ ...d, comment: e.target.value.slice(0, 300) }))}
            placeholder="Anything else? Optional. Do not include personal details."
            className="field h-11"
            aria-label="Optional comment"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Your answer is used to measure accuracy and improve future models.</p>
            <Button size="sm" loading={saving} onClick={() => save()}>Send feedback</Button>
          </div>
        </div>
      )}
    </div>
  )
}
