import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { ScanResult } from '@/components/scan/ScanResult'
import { RiskBadge, TypeBadge, Skeleton, EmptyState } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { RISK } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'

export default function ScanDetail() {
  const { id } = useParams()
  const [scan, setScan] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.scans.get(id).then(setScan).catch(setError)
  }, [id])

  return (
    <>
      <Link to="/app/history" className="mb-5 inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-semibold text-slate-600 transition hover:text-fg focus-visible:shadow-glow">
        <ArrowLeft className="size-4" /> Back to history
      </Link>

      {error ? (
        <div className="card">
          <EmptyState icon={FileQuestion} title="Check not found" description="It may have been deleted." action={<Button as={Link} to="/app/history" variant="secondary">Go to history</Button>} />
        </div>
      ) : !scan ? (
        <div className="space-y-4"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>
      ) : scan.findings ? (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <TypeBadge type={scan.scan_type} /> Checked {formatDateTime(scan.created_at)}
          </div>
          <ScanResult result={scan} content={scan.content} />
        </>
      ) : (
        <div className="card max-w-2xl p-6">
          <div className="flex flex-wrap items-center gap-3">
            <TypeBadge type={scan.scan_type} />
            <RiskBadge level={scan.risk_level} />
          </div>
          <h1 className="mt-4 text-2xl font-bold">{scan.scam_category === 'No category' ? 'No warning signs found' : scan.scam_category}</h1>
          <p className="mt-1 text-slate-600">{RISK[scan.risk_level].meaning}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-500">Summary</dt><dd className="font-semibold">{scan.preview}</dd></div>
            <div><dt className="text-slate-500">Risk score</dt><dd className="font-semibold">{scan.risk_score} / 100</dd></div>
            <div><dt className="text-slate-500">Checked</dt><dd className="font-semibold">{formatDateTime(scan.created_at)}</dd></div>
          </dl>
          <p className="mt-6 rounded-xl bg-canvas p-3 text-sm text-slate-600">Detailed findings are not available for this older check.</p>
        </div>
      )}
    </>
  )
}
