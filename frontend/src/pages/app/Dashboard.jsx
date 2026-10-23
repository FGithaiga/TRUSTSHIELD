import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ScanSearch, ShieldAlert, AlertTriangle, ShieldCheck, Table2, BarChart3, History, Radar, GraduationCap, Flame, Lightbulb } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { ActivityChart, ActivityLegend, ActivityTable } from '@/components/charts/ActivityChart'
import { HBarList } from '@/components/charts/HBarList'
import { RiskBadge, TypeBadge, Segmented, Skeleton, EmptyState } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api } from '@/lib/api'
import { SCAN_TYPES } from '@/lib/constants'
import { PulseCard } from '@/components/community/PulseCard'
import { CountUp } from '@/components/ui/Motion'
import { tipOfTheDay } from '@/data/tips'
import { cx, timeAgo } from '@/lib/format'

const QUICK = [
  { type: 'mpesa', title: 'Check an M-PESA message', text: 'Fake reversals, PIN requests, prize claims.' },
  { type: 'url', title: 'Inspect a link', text: 'Look-alike domains and risky link structure.' },
  { type: 'offer', title: 'Assess an offer', text: 'Job fees, investment promises, prepay deals.' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return { sw: 'Habari za asubuhi', en: 'Good morning' }
  if (h < 17) return { sw: 'Habari za mchana', en: 'Good afternoon' }
  return { sw: 'Habari za jioni', en: 'Good evening' }
}

function ScamSenseCard() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    api.trainer.stats().then(setStats).catch(() => {})
  }, [])
  return (
    <div className="dot-grid flex flex-col rounded-2xl bg-ink-900 p-6 text-white">
      <div className="flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-xl bg-ink-800"><GraduationCap className="size-5 text-mint-300" /></span>
        {stats?.streak_days > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1 text-xs font-semibold text-mint-300">
            <Flame className="size-3.5" /> {stats.streak_days} day streak
          </span>
        )}
      </div>
      <h2 className="mt-4 text-lg font-bold">Scam Sense</h2>
      {stats?.answered ? (
        <p className="mt-1.5 text-sm text-mist-300">
          Level <span className="font-semibold text-white">{stats.level}</span> &middot; {stats.accuracy}% accuracy over {stats.answered} messages.
        </p>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-mist-300">Practise spotting scams on fictional messages and see what TrustShield's models notice.</p>
      )}
      <div className="mt-auto pt-6">
        <Button as={Link} to="/app/trainer" variant="light" iconRight={ArrowRight}>{stats?.played_today ? 'Play another round' : "Play today's round"}</Button>
      </div>
    </div>
  )
}

function TipCard() {
  const tip = tipOfTheDay()
  return (
    <div className="card flex flex-col p-6">
      <span className="grid size-11 place-items-center rounded-xl bg-brand-50"><Lightbulb className="size-5 text-brand-ink" /></span>
      <p className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Safety tip of the day</p>
      <p className="mt-1.5 text-lg leading-snug font-bold text-fg">{tip.sw}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{tip.en}</p>
    </div>
  )
}

function StatTile({ label, value, total, icon: Icon, tone, delay }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  const tones = {
    brand: 'bg-brand-50 text-brand-ink',
    high: 'bg-risk-high-bg text-risk-high-fg',
    caution: 'bg-risk-caution-bg text-risk-caution-fg',
    clear: 'bg-risk-clear-bg text-risk-clear-fg',
  }
  return (
    <div className="card animate-fade-up p-5 transition-shadow duration-200 hover:shadow-lift" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <span className={cx('grid size-9 place-items-center rounded-xl', tones[tone])}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[32px] leading-none font-bold tracking-tight text-fg"><CountUp value={value} /></p>
      <p className="mt-2 text-[13px] text-slate-500">{tone === 'brand' ? 'checks in this period' : `${pct}% of checks`}</p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [days, setDays] = useState('30')
  const [data, setData] = useState(null)
  const [view, setView] = useState('chart')

  useEffect(() => {
    let live = true
    api.dashboard
      .summary({ days })
      .then((d) => live && setData(d))
      .catch((e) => toast(e.message, { type: 'error', title: 'Could not load dashboard' }))
    return () => {
      live = false
    }
  }, [days, toast])

  const t = data?.totals

  return (
    <>
      <PageHeader
        title={`${greeting().sw}, ${user?.full_name?.split(' ')[0] ?? 'rafiki'}`}
        description={`${greeting().en}. Here is your safety overview.`}
        action={<Button icon={ScanSearch} onClick={() => navigate('/app/mpesa')}>New check</Button>}
      />

      {/* Quick actions */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {QUICK.map((q, i) => {
          const meta = SCAN_TYPES[q.type]
          const Icon = meta.icon
          return (
            <Link
              key={q.type}
              to={meta.path}
              className="group card flex animate-fade-up items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_0_0_4px_rgb(40_104_215/0.08),0_12px_32px_-12px_rgb(16_36_58/0.2)] focus-visible:shadow-glow"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink-900 text-white transition-colors duration-200 group-hover:bg-brand-600">
                <Icon className="size-[22px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-fg">{q.title}</span>
                <span className="block text-sm text-slate-500">{q.text}</span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-ink" />
            </Link>
          )
        })}
      </div>

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {t ? (
          <>
            <StatTile label="Total checks" value={t.scans} total={t.scans} icon={ScanSearch} tone="brand" delay={0} />
            <StatTile label="High risk" value={t.high} total={t.scans} icon={ShieldAlert} tone="high" delay={50} />
            <StatTile label="Caution" value={t.caution} total={t.scans} icon={AlertTriangle} tone="caution" delay={100} />
            <StatTile label="No obvious warning" value={t.clear} total={t.scans} icon={ShieldCheck} tone="clear" delay={150} />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-2xl" />)
        )}
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Activity */}
        <div className="card flex flex-col p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-bold text-fg">Checks over time</h2>
              <p className="text-sm text-slate-500">Daily checks by risk level</p>
            </div>
            <div className="flex items-center gap-2">
              <Segmented value={days} onChange={setDays} options={[{ value: '7', label: '7D' }, { value: '30', label: '30D' }, { value: '90', label: '90D' }]} />
              <button
                onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
                className="grid size-9 place-items-center rounded-lg border border-line text-slate-600 transition hover:bg-canvas hover:text-fg focus-visible:shadow-glow"
                aria-label={view === 'chart' ? 'Show as table' : 'Show as chart'}
                title={view === 'chart' ? 'Show as table' : 'Show as chart'}
              >
                {view === 'chart' ? <Table2 className="size-4" /> : <BarChart3 className="size-4" />}
              </button>
            </div>
          </div>
          <div className="mb-3"><ActivityLegend /></div>
          <div className="min-h-[240px] flex-1">
            {data ? view === 'chart' ? <ActivityChart data={data.by_day} /> : <ActivityTable data={data.by_day} /> : <Skeleton className="h-full min-h-[240px]" />}
          </div>
        </div>

        {/* By type + categories */}
        <div className="card p-5">
          <h2 className="text-[17px] font-bold text-fg">Checks by type</h2>
          <p className="mb-5 text-sm text-slate-500">What you checked most</p>
          {data ? (
            <HBarList items={data.by_type.map((b) => ({ label: SCAN_TYPES[b.scan_type].label, value: b.count, icon: SCAN_TYPES[b.scan_type].icon }))} />
          ) : (
            <Skeleton className="h-28" />
          )}
          <div className="my-5 border-t border-line" />
          <h3 className="mb-4 text-sm font-bold text-fg">Top scam categories</h3>
          {data ? (
            <HBarList color="var(--color-chart-2)" items={data.top_categories.map((c) => ({ label: c.category, value: c.count }))} emptyText="No suspicious categories in this period." />
          ) : (
            <Skeleton className="h-28" />
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Recent */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 className="text-[17px] font-bold text-fg">Recent checks</h2>
              <p className="text-sm text-slate-500">Your latest results</p>
            </div>
            <Link to="/app/history" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-ink transition hover:bg-brand-50 focus-visible:shadow-glow">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          {!data ? (
            <div className="space-y-2 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          ) : data.recent.length === 0 ? (
            <EmptyState icon={History} title="No checks yet" description="Run your first check to see results here." />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {data.recent.map((s) => (
                <li key={s.id}>
                  <Link to={`/app/history/${s.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-canvas/70 focus-visible:bg-canvas">
                    <TypeBadge type={s.scan_type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{s.scam_category === 'No category' ? 'No warning signs found' : s.scam_category}</p>
                      <p className="truncate text-[13px] text-slate-500">{s.preview}</p>
                    </div>
                    <span className="hidden text-[13px] whitespace-nowrap text-slate-500 sm:block">{timeAgo(s.created_at)}</span>
                    <RiskBadge level={s.risk_level} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <PulseCard />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <ScamSenseCard />
        <TipCard />
        <div className="card flex flex-col p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-50"><Radar className="size-5 text-brand-ink" /></span>
          <h2 className="mt-4 text-lg font-bold text-fg">See what is circulating</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            The threat feed shows scam patterns reported by the community, so you can recognize them before they reach you.
          </p>
          <div className="mt-auto pt-6">
            <Button as={Link} to="/app/threat-feed" variant="secondary" iconRight={ArrowRight}>Open threat feed</Button>
          </div>
        </div>
      </div>
    </>
  )
}
