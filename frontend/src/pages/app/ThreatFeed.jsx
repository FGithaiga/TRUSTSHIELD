import { useEffect, useState } from 'react'
import { MapPin, Clock, Send, Radar, Info, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Textarea, Select, Input } from '@/components/ui/Field'
import { Pill, Segmented, Skeleton, EmptyState, TypeBadge } from '@/components/ui/Misc'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/format'
import { useToast } from '@/context/ToastContext'

const STATUS = {
  synthetic: { tone: 'slate', label: 'Demo example' },
  pending: { tone: 'amber', label: 'Awaiting review' },
  verified: { tone: 'green', label: 'Reviewed' },
}

function ReportForm({ onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({ channel: 'mpesa', category: '', region: '', summary: '', involved: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await api.reports.create(form)
      onCreated(r)
      toast('Thanks. Your report will appear publicly after review.', { type: 'success', title: 'Report submitted' })
      onClose()
    } catch (err) {
      setError(err.fields?.summary?.[0] ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink-950/50" onClick={onClose} />
      <form onSubmit={submit} className="relative w-full max-w-lg animate-scale-in rounded-2xl bg-surface p-6 shadow-lift" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="report-title" className="text-lg font-bold">Report a scam</h2>
            <p className="text-sm text-slate-500">Describe the pattern, not the people. Do not include phone numbers, names or personal details.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Channel" value={form.channel} onChange={set('channel')} options={[{ value: 'mpesa', label: 'M-PESA message' }, { value: 'url', label: 'Link' }, { value: 'offer', label: 'Offer' }]} />
          <Input label="County or town" placeholder="Optional" value={form.region} onChange={set('region')} />
        </div>
        <Input className="mt-4" label="Short title" placeholder="e.g. Fake loan approval SMS" value={form.category} onChange={set('category')} />
        <Input
          className="mt-4"
          label="Phone number or link involved"
          placeholder="Optional, for example 07XX XXX XXX or a website"
          value={form.involved}
          onChange={set('involved')}
          hint="Kept private. Stored only as a fingerprint so others who check the same number or link are warned once the report is approved."
        />
        <Textarea className="mt-4" label="What does the scam look like?" value={form.summary} onChange={(e) => (set('summary')(e), setError(''))} error={error} maxLength={600} rows={4} placeholder="How it starts, what it asks for, and the warning signs." />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon={Send} loading={saving}>Submit for review</Button>
        </div>
      </form>
    </div>
  )
}

export default function ThreatFeed() {
  const [channel, setChannel] = useState('')
  const [reports, setReports] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setReports(null)
    api.reports.list({ channel }).then((d) => setReports(d.results)).catch(() => setReports([]))
  }, [channel])

  useEffect(() => {
    if (!open) return
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open])

  return (
    <>
      <PageHeader
        title="Threat Feed"
        description="Scams the community has spotted."
        action={<Button icon={Send} onClick={() => setOpen(true)}>Report a scam</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={channel} onChange={setChannel} options={[{ value: '', label: 'All' }, { value: 'mpesa', label: 'M-PESA' }, { value: 'url', label: 'Links' }, { value: 'offer', label: 'Offers' }]} />
        <p className="flex items-center gap-1.5 text-[13px] text-slate-500">
          <Info className="size-4" /> Entries marked &ldquo;Demo example&rdquo; are illustrative and not verified incidents.
        </p>
      </div>

      {!reports ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className="card"><EmptyState icon={Radar} title="No reports yet" description="Be the first to share a scam pattern." /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((r, i) => (
            <article key={r.id} className="card flex animate-fade-up flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center justify-between gap-2">
                <TypeBadge type={r.channel} />
                <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
              </div>
              <h2 className="mt-3 font-bold text-fg">{r.category}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{r.summary}</p>
              {r.indicators?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.indicators.map((ind) => <span key={ind} className="rounded-md border border-line bg-canvas px-2 py-0.5 text-xs font-medium text-slate-600">{ind}</span>)}
                </div>
              )}
              <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-[13px] text-slate-500">
                <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{r.region === 'Not stated' && r.platform ? `Seen on ${r.platform}` : r.region}</span>
                <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{timeAgo(r.reported_at)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && <ReportForm onClose={() => setOpen(false)} onCreated={(r) => setReports((list) => (channel && r.channel !== channel ? list : [r, ...(list ?? [])]))} />}
    </>
  )
}
