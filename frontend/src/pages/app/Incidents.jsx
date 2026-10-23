import { useEffect, useState } from 'react'
import { Smartphone, KeyRound, Link2, BriefcaseBusiness, ShoppingBag, CircleHelp, Check, ArrowLeft, ArrowRight, Copy, Phone, ExternalLink, FileCheck2, LifeBuoy } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select, Checkbox } from '@/components/ui/Field'
import { Pill, Skeleton } from '@/components/ui/Misc'
import { api } from '@/lib/api'
import { cx, formatDateTime } from '@/lib/format'
import { useToast } from '@/context/ToastContext'

const TYPES = [
  { id: 'sent_money', icon: Smartphone, title: 'I sent money to a scammer', text: 'Paid via M-PESA, till or paybill' },
  { id: 'shared_pin', icon: KeyRound, title: 'I shared my PIN or OTP', text: 'Or a password or ID details' },
  { id: 'clicked_link', icon: Link2, title: 'I opened a suspicious link', text: 'And may have entered details' },
  { id: 'job_fee', icon: BriefcaseBusiness, title: 'I paid a job or training fee', text: 'To a recruiter or agent' },
  { id: 'shopping', icon: ShoppingBag, title: 'I paid for goods never delivered', text: 'Online shop or social seller' },
  { id: 'other', icon: CircleHelp, title: 'Something else', text: 'Describe it in the next step' },
]

const URGENT = {
  sent_money: ['Call Safaricom Customer Care immediately and give them the transaction code.', 'Do not send more money to recover the first payment.'],
  shared_pin: ['Change your M-PESA PIN now by dialling *334#.', 'Call Safaricom Customer Care to secure your line and account.'],
  clicked_link: ['Change any password you entered on that page.', 'Watch your M-PESA and bank accounts for unfamiliar activity.'],
  job_fee: ['Stop all further payments and communication with the recruiter.', 'Keep the advert, chats and payment confirmation as evidence.'],
  shopping: ['Keep the listing, chat and payment confirmation.', 'Report the seller account on the platform where you found it.'],
  other: ['Stop communicating with the other party.', 'Keep screenshots and messages as evidence.'],
}

const STEPS = ['What happened', 'Details', 'Review']
const EMPTY = { incident_type: '', occurred_at: '', amount: '', channel: 'mpesa', transaction_code: '', suspect_contact: '', description: '', consent: false }

function Stepper({ step }) {
  return (
    <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span className={cx('grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-all duration-300', i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-ink-900 text-white shadow-glow' : 'bg-canvas text-slate-400')}>
            {i < step ? <Check className="size-4" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cx('hidden text-sm font-semibold sm:block', i <= step ? 'text-fg' : 'text-slate-400')}>{s}</span>
          {i < STEPS.length - 1 && <span className={cx('h-0.5 flex-1 rounded-full transition-colors duration-300', i < step ? 'bg-brand-600' : 'bg-line')} />}
        </li>
      ))}
    </ol>
  )
}

function Resources({ guidance }) {
  if (!guidance) return <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
  return (
    <ul className="space-y-2.5">
      {guidance.resources.map((r) => (
        <li key={r.id} className="rounded-xl border border-line p-3.5 transition hover:border-line-strong">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-fg">{r.name}</p>
            <Pill tone={r.kind === 'Emergency' ? 'red' : r.kind === 'Report' ? 'brand' : 'slate'}>{r.kind}</Pill>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-ink"><Phone className="size-3.5" />{r.contact}</p>
          <p className="mt-0.5 text-[13px] text-slate-500">{r.description}</p>
          {r.url && (
            <a href={r.url} target="_blank" rel="noreferrer noopener" className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-brand-ink">
              Official website <ExternalLink className="size-3" />
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function Incidents() {
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState(null)
  const [guidance, setGuidance] = useState(null)
  const [past, setPast] = useState(null)

  useEffect(() => {
    api.guidance().then(setGuidance).catch(() => {})
    api.incidents.list().then((d) => setPast(d.results)).catch(() => setPast([]))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))
  const type = TYPES.find((t) => t.id === form.incident_type)

  const next = () => {
    if (step === 0 && !form.incident_type) return setErrors({ incident_type: 'Choose what happened.' })
    if (step === 1 && form.description.trim().length < 20) return setErrors({ description: 'Describe what happened in at least 20 characters.' })
    setErrors({})
    setStep((s) => s + 1)
  }

  const submit = async () => {
    if (!form.consent) return setErrors({ consent: 'Confirm that you agree to store this summary.' })
    setSaving(true)
    try {
      const payload = { ...form, amount: form.amount ? Number(form.amount) : null, occurred_at: form.occurred_at || null }
      const inc = await api.incidents.create(payload)
      setCreated(inc)
      setPast((p) => [inc, ...(p ?? [])])
      toast(`Reference ${inc.reference}`, { type: 'success', title: 'Incident summary saved' })
    } catch (e) {
      setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[0]])))
      if (!Object.keys(e.fields).length) toast(e.message, { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const summaryText = (inc) =>
    [
      `TrustShield 254 incident summary (${inc.reference})`,
      `What happened: ${TYPES.find((t) => t.id === inc.incident_type)?.title}`,
      inc.occurred_at && `When: ${formatDateTime(inc.occurred_at)}`,
      inc.amount && `Amount: Ksh ${Number(inc.amount).toLocaleString()}`,
      inc.transaction_code && `Transaction code: ${inc.transaction_code}`,
      inc.suspect_contact && `Other party contact: ${inc.suspect_contact}`,
      `Description: ${inc.description}`,
    ].filter(Boolean).join('\n')

  const copy = async (inc) => {
    try {
      await navigator.clipboard.writeText(summaryText(inc))
      toast('Summary copied. Paste it when you report the incident.', { type: 'success' })
    } catch {
      toast('Copy failed. Select the text and copy it manually.', { type: 'error' })
    }
  }

  const restart = () => (setCreated(null), setForm(EMPTY), setStep(0), setErrors({}))

  return (
    <>
      <PageHeader title="Incident Assistant" description="Scammed? Act fast. We will guide you step by step." />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card p-5 sm:p-6">
          {created ? (
            <div className="animate-fade-up">
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid size-14 place-items-center rounded-full bg-risk-clear-bg text-risk-clear-fg"><FileCheck2 className="size-7" /></span>
                <div>
                  <p className="text-sm text-slate-500">Incident summary saved</p>
                  <p className="font-mono text-2xl font-bold tracking-tight">{created.reference}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-risk-high-line bg-risk-high-bg p-5">
                <p className="font-bold text-risk-high-fg">Do these now</p>
                <ol className="mt-3 space-y-2">
                  {URGENT[created.incident_type].map((u, i) => (
                    <li key={u} className="flex gap-3 text-[15px] text-fg">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-risk-high text-xs font-bold text-white">{i + 1}</span>{u}
                    </li>
                  ))}
                  <li className="flex gap-3 text-[15px] text-fg">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-risk-high text-xs font-bold text-white">{URGENT[created.incident_type].length + 1}</span>
                    Report to the official channels listed on this page, using the summary below.
                  </li>
                </ol>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">Your summary</p>
                  <Button size="sm" variant="secondary" icon={Copy} onClick={() => copy(created)}>Copy</Button>
                </div>
                <pre className="rounded-xl border border-line bg-canvas p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-slate-700">{summaryText(created)}</pre>
                <p className="mt-2 text-xs text-slate-500">TrustShield 254 does not send this to any authority. You choose where to report it.</p>
              </div>

              <Button className="mt-6" variant="ghost" icon={ArrowLeft} onClick={restart}>Start a new summary</Button>
            </div>
          ) : (
            <>
              <Stepper step={step} />

              {step === 0 && (
                <div className="animate-fade-up">
                  <h2 className="text-lg font-bold">What happened?</h2>
                  <p className="mb-4 text-sm text-slate-500">Choose the option that fits best.</p>
                  <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                    {TYPES.map((t) => {
                      const Icon = t.icon
                      const on = form.incident_type === t.id
                      return (
                        <button
                          key={t.id}
                          role="radio"
                          aria-checked={on}
                          onClick={() => (set('incident_type')(t.id), setErrors({}))}
                          className={cx('flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all duration-150 focus-visible:shadow-glow', on ? 'border-brand-500 bg-brand-50/50 shadow-[0_0_0_4px_rgb(40_104_215/0.1)]' : 'border-line hover:border-line-strong hover:bg-canvas/50')}
                        >
                          <span className={cx('grid size-10 shrink-0 place-items-center rounded-lg transition-colors', on ? 'bg-brand-600 text-white' : 'bg-canvas text-slate-600')}><Icon className="size-5" /></span>
                          <span>
                            <span className="block text-sm font-semibold text-fg">{t.title}</span>
                            <span className="block text-[13px] text-slate-500">{t.text}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.incident_type && <p className="mt-3 text-sm font-medium text-risk-high-fg">{errors.incident_type}</p>}
                </div>
              )}

              {step === 1 && (
                <div className="animate-fade-up space-y-4">
                  <div>
                    <h2 className="text-lg font-bold">Details</h2>
                    <p className="text-sm text-slate-500">Add what you know. Only the description is required. Never enter your PIN or password.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="When did it happen?" type="datetime-local" value={form.occurred_at} onChange={set('occurred_at')} max={new Date().toISOString().slice(0, 16)} />
                    <Input label="Amount lost (Ksh)" type="number" min="0" inputMode="numeric" placeholder="0" value={form.amount} onChange={set('amount')} />
                    <Select label="How did you pay?" value={form.channel} onChange={set('channel')} options={[{ value: 'mpesa', label: 'M-PESA send money' }, { value: 'till', label: 'Till or paybill' }, { value: 'bank', label: 'Bank transfer' }, { value: 'card', label: 'Card' }, { value: 'none', label: 'No payment made' }]} />
                    <Input label="M-PESA transaction code" placeholder="e.g. TJK4XXXXXX" value={form.transaction_code} onChange={(e) => set('transaction_code')(e.target.value.toUpperCase())} hint="Found in the confirmation SMS" />
                  </div>
                  <Input label="Scammer's phone number, account or link" placeholder="Number, username or website" value={form.suspect_contact} onChange={set('suspect_contact')} />
                  <Textarea label="What happened?" placeholder="Describe the events in order: how they contacted you, what they asked for and what you did." value={form.description} onChange={set('description')} error={errors.description} maxLength={2000} rows={5} />
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-up">
                  <h2 className="text-lg font-bold">Review</h2>
                  <p className="mb-4 text-sm text-slate-500">Check the details before saving.</p>
                  <dl className="divide-y divide-line rounded-xl border border-line">
                    {[
                      ['What happened', type?.title],
                      ['When', form.occurred_at ? formatDateTime(form.occurred_at) : 'Not stated'],
                      ['Amount', form.amount ? `Ksh ${Number(form.amount).toLocaleString()}` : 'Not stated'],
                      ['Transaction code', form.transaction_code || 'Not stated'],
                      ['Other party', form.suspect_contact || 'Not stated'],
                      ['Description', form.description],
                    ].map(([k, v]) => (
                      <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr]">
                        <dt className="text-sm text-slate-500">{k}</dt>
                        <dd className="text-sm font-medium break-words text-fg">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-5 rounded-xl bg-canvas p-4">
                    <Checkbox
                      checked={form.consent}
                      onChange={(v) => (set('consent')(v), setErrors({}))}
                      label="Save this summary to my account"
                      description="It is stored privately so you can return to it. You can delete it at any time. It is not shared with anyone."
                    />
                    {errors.consent && <p className="mt-2 text-sm font-medium text-risk-high-fg">{errors.consent}</p>}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
                <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep((s) => s - 1)} disabled={step === 0}>Back</Button>
                {step < 2 ? (
                  <Button iconRight={ArrowRight} onClick={next}>Continue</Button>
                ) : (
                  <Button icon={FileCheck2} loading={saving} onClick={submit}>Save summary</Button>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-1 font-bold">Official reporting channels</h2>
            <p className="mb-4 text-[13px] text-slate-500">Contact details last reviewed {guidance?.verified_on ?? '...'}.</p>
            <Resources guidance={guidance} />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-bold">Your past summaries</h2>
            {!past ? (
              <Skeleton className="h-12" />
            ) : past.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-slate-500"><LifeBuoy className="size-4" /> None yet.</p>
            ) : (
              <ul className="space-y-2">
                {past.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <button onClick={() => setCreated(p)} className="w-full rounded-xl border border-line px-3.5 py-2.5 text-left transition hover:border-brand-400 hover:bg-brand-50/40 focus-visible:shadow-glow">
                      <p className="font-mono text-sm font-semibold">{p.reference}</p>
                      <p className="text-[13px] text-slate-500">{TYPES.find((t) => t.id === p.incident_type)?.title} &middot; {formatDateTime(p.created_at)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
