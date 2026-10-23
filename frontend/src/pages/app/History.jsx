import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Trash2, ChevronLeft, ChevronRight, History as HistoryIcon, ScanSearch } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { RiskBadge, TypeBadge, Segmented, Skeleton, EmptyState } from '@/components/ui/Misc'
import { Select } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { useToast } from '@/context/ToastContext'

const PAGE_SIZE = 10

export default function History() {
  const toast = useToast()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [risk, setRisk] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    const id = setTimeout(() => (setQuery(search), setPage(1)), 300)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    let live = true
    setData(null)
    api.scans
      .list({ search: query, scan_type: type, risk_level: risk, page, page_size: PAGE_SIZE })
      .then((d) => live && setData(d))
      .catch((e) => toast(e.message, { type: 'error' }))
    return () => {
      live = false
    }
  }, [query, type, risk, page, toast])

  const remove = async (id) => {
    try {
      await api.scans.remove(id)
      setData((d) => ({ ...d, count: d.count - 1, results: d.results.filter((s) => s.id !== id) }))
      toast('The check was removed from your history.', { type: 'success' })
    } catch (e) {
      toast(e.message, { type: 'error' })
    } finally {
      setConfirmId(null)
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1
  const filtered = query || type || risk

  return (
    <>
      <PageHeader title="History" description="Every check you have run." />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by category or domain" className="field h-11 pl-11" aria-label="Search history" />
          </div>
          <Select
            aria-label="Filter by type"
            value={type}
            onChange={(e) => (setType(e.target.value), setPage(1))}
            className="lg:w-48 [&_select]:h-11"
            options={[{ value: '', label: 'All types' }, { value: 'mpesa', label: 'M-PESA' }, { value: 'url', label: 'Links' }, { value: 'offer', label: 'Offers' }]}
          />
          <Segmented
            value={risk}
            onChange={(v) => (setRisk(v), setPage(1))}
            options={[{ value: '', label: 'All' }, { value: 'high', label: 'High' }, { value: 'caution', label: 'Caution' }, { value: 'clear', label: 'Clear' }]}
          />
        </div>

        {!data ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : data.results.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title={filtered ? 'No checks match these filters' : 'No checks yet'}
            description={filtered ? 'Try a different search or clear the filters.' : 'Your checks will appear here.'}
            action={!filtered && <Button icon={ScanSearch} onClick={() => navigate('/app/mpesa')}>Run a check</Button>}
          />
        ) : (
          <>
          {/* Phones: one card per check */}
          <ul className="divide-y divide-line md:hidden">
            {data.results.map((s, i) => (
              <li key={s.id} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <Link to={`/app/history/${s.id}`} className="min-w-0 flex-1 rounded focus-visible:shadow-glow">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <TypeBadge type={s.scan_type} />
                      <RiskBadge level={s.risk_level} size="sm" />
                    </div>
                    <p className="truncate font-semibold text-fg">{s.scam_category === 'No category' ? 'No warning signs found' : s.scam_category}</p>
                    <p className="truncate text-[13px] text-slate-500">{s.preview}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(s.created_at)} &middot; score {s.risk_score}</p>
                  </Link>
                  {confirmId === s.id ? (
                    <div className="flex animate-fade-in flex-col gap-1">
                      <Button size="sm" variant="danger" onClick={() => remove(s.id)}>Delete</Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(s.id)} className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-risk-high-bg hover:text-risk-high-fg focus-visible:shadow-glow" aria-label="Delete check">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Result</th>
                  <th className="px-5 py-3">Risk</th>
                  <th className="px-5 py-3 text-right">Score</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.results.map((s) => (
                  <tr key={s.id} className="group transition hover:bg-canvas/60">
                    <td className="px-5 py-3.5"><TypeBadge type={s.scan_type} /></td>
                    <td className="max-w-[320px] px-5 py-3.5">
                      <Link to={`/app/history/${s.id}`} className="block rounded focus-visible:shadow-glow">
                        <span className="block truncate font-semibold text-fg group-hover:text-brand-ink">{s.scam_category === 'No category' ? 'No warning signs found' : s.scam_category}</span>
                        <span className="block truncate text-[13px] text-slate-500">{s.preview}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5"><RiskBadge level={s.risk_level} size="sm" /></td>
                    <td className="tabular px-5 py-3.5 text-right font-semibold">{s.risk_score}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">{formatDateTime(s.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmId === s.id ? (
                        <span className="inline-flex animate-fade-in items-center gap-1">
                          <Button size="sm" variant="danger" onClick={() => remove(s.id)}>Delete</Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmId(s.id)} className="rounded-lg p-2 text-slate-400 transition pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 hover:bg-risk-high-bg hover:text-risk-high-fg focus-visible:opacity-100 focus-visible:shadow-glow" aria-label="Delete check">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {data && data.count > 0 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-slate-500">
            <span className="tabular">
              {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, data.count)} of {data.count}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="tabular px-2">{page} / {pages}</span>
              <Button size="sm" variant="ghost" iconRight={ChevronRight} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
