import { useEffect, useRef, useState } from 'react'
import { Search, SquareArrowOutUpRight, X, ShieldQuestion, Lock, ClipboardPaste } from 'lucide-react'
import { api } from '@/lib/api'
import { cx } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Textarea, Select } from '@/components/ui/Field'
import { ScanProgress } from './ScanProgress'
import { ScanResult } from './ScanResult'
import { useToast } from '@/context/ToastContext'

const MIN_PROGRESS_MS = 1100
const MAX_LEN = 5000

function SampleChips({ samples, onPick, activeId }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[13px] font-medium text-slate-500">Try a fictional sample:</span>
      {samples.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s)}
          className={cx(
            'rounded-full border px-3 py-1 text-[13px] font-semibold transition-all duration-150 focus-visible:shadow-glow',
            activeId === s.id ? 'border-brand-500 bg-brand-50 text-brand-ink' : 'border-line-strong bg-surface text-slate-600 hover:border-brand-400 hover:text-brand-ink',
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

export function Checker({ scanType, inputLabel, placeholder, samples, offerTypes, tips, submitLabel = 'Check now' }) {
  const toast = useToast()
  const [content, setContent] = useState('')
  const [offerType, setOfferType] = useState(offerTypes?.[0]?.value)
  const [sampleId, setSampleId] = useState(null)
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)
  const [submitted, setSubmitted] = useState('')
  const [error, setError] = useState('')
  const resultRef = useRef(null)
  const inputRef = useRef(null)
  const isUrl = scanType === 'url'

  useEffect(() => {
    if (state === 'done' || state === 'loading') resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [state])

  const pick = (s) => {
    setContent(s.text)
    setSampleId(s.id)
    if (s.offer_type) setOfferType(s.offer_type)
    setError('')
  }

  const reset = () => {
    setContent('')
    setSampleId(null)
    setResult(null)
    setState('idle')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setContent(text.slice(0, MAX_LEN))
    } catch {
      toast('Your browser blocked clipboard access. Paste with Ctrl+V instead.', { type: 'info' })
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const value = content.trim()
    if (!value) {
      setError(isUrl ? 'Enter a link to check.' : 'Paste the text you want to check.')
      inputRef.current?.focus()
      return
    }
    setError('')
    setState('loading')
    const started = Date.now()
    try {
      const data = await api.scans.analyze({ scan_type: scanType, content: value, ...(offerTypes ? { offer_type: offerType } : {}) })
      await new Promise((r) => setTimeout(r, Math.max(0, MIN_PROGRESS_MS - (Date.now() - started))))
      setSubmitted(value)
      setResult(data)
      setState('done')
    } catch (err) {
      setState('idle')
      if (err.fields?.content) setError(err.fields.content[0])
      else toast(err.message, { type: 'error', title: 'Check failed' })
    }
  }

  const form = isUrl ? (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <label htmlFor="url-input" className="mb-3 block text-[19px] font-bold text-fg">{inputLabel}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SquareArrowOutUpRight className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-500" />
          <input
            id="url-input"
            ref={inputRef}
            value={content}
            onChange={(e) => (setContent(e.target.value), setSampleId(null), setError(''))}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            inputMode="url"
            aria-invalid={!!error}
            className={cx('field h-14 pr-12 pl-12 font-mono text-[15px]', content && result?.risk_level === 'high' && state === 'done' ? 'text-risk-high-fg' : '', error && 'border-risk-high')}
          />
          {content && (
            <button type="button" onClick={() => (setContent(''), setSampleId(null), inputRef.current?.focus())} className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-fg" aria-label="Clear link">
              <X className="size-5" />
            </button>
          )}
        </div>
        <Button type="submit" size="lg" icon={Search} loading={state === 'loading'} className="h-14 px-7 text-[16px]">
          {submitLabel}
        </Button>
      </div>
      {error ? <p className="mt-2 text-[13px] font-medium text-risk-high-fg">{error}</p> : <p className="mt-2.5 text-sm text-slate-500">Include http:// or https://. We never open the link.</p>}
      <div className="mt-4 border-t border-line pt-4">
        <SampleChips samples={samples} onPick={pick} activeId={sampleId} />
      </div>
    </form>
  ) : (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[19px] font-bold text-fg">{inputLabel}</p>
        <Button type="button" variant="ghost" size="sm" icon={ClipboardPaste} onClick={paste}>Paste</Button>
      </div>
      {offerTypes && (
        <Select label="Type of offer" options={offerTypes} value={offerType} onChange={(e) => setOfferType(e.target.value)} className="mb-4 sm:max-w-xs" />
      )}
      <Textarea
        ref={inputRef}
        aria-label={inputLabel}
        value={content}
        onChange={(e) => (setContent(e.target.value), setSampleId(null), setError(''))}
        placeholder={placeholder}
        maxLength={MAX_LEN}
        error={error}
        rows={6}
      />
      <div className="mt-4">
        <SampleChips samples={samples} onPick={pick} activeId={sampleId} />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="flex items-center gap-1.5 text-[13px] text-slate-500">
          <Lock className="size-3.5" /> Never paste your PIN or OTP.
        </p>
        <Button type="submit" icon={Search} loading={state === 'loading'}>{submitLabel}</Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-6">
      {tips ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {form}
          <aside className="card h-fit p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldQuestion className="size-5 text-brand-ink" />
              <p className="font-bold text-fg">{tips.title}</p>
            </div>
            <ul className="space-y-3">
              {tips.items.map((t) => (
                <li key={t} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />
                  {t}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : (
        form
      )}

      <div ref={resultRef} className="scroll-mt-24">
        {state === 'loading' && <ScanProgress scanType={scanType} />}
        {state === 'done' && result && <ScanResult result={result} content={submitted} onReset={reset} />}
      </div>
    </div>
  )
}
