import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe, XCircle, CheckCircle2, LayoutGrid, ShieldAlert, Info, ChevronDown, Sparkles, Cpu, ListChecks,
  LifeBuoy, RotateCcw, Tag, FileText, ArrowRight,
} from 'lucide-react'
import { ScoreRing } from './ScoreRing'
import { HighlightedText } from './HighlightedText'
import { Anatomy } from './Anatomy'
import { CommunityMatches } from './CommunityMatches'
import { ShareAndListen } from './ShareAndListen'
import { FeedbackWidget } from './FeedbackWidget'
import { RISK } from '@/lib/constants'
import { cx, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/Button'

const SEVERITY = {
  high: { label: 'Strong', dot: 'bg-risk-high', text: 'text-risk-high-fg' },
  medium: { label: 'Moderate', dot: 'bg-risk-caution-dot', text: 'text-risk-caution-fg' },
  low: { label: 'Minor', dot: 'bg-slate-400', text: 'text-slate-500' },
}
const SOURCE = { rule: 'Rule check', model: 'ML model', url: 'Link analysis', community: 'Community memory' }

function Column({ icon: Icon, title, iconClass, children }) {
  return (
    <div className="min-w-0 px-5 py-5">
      <div className="mb-3 flex items-center gap-2.5">
        <Icon className={cx('size-5 shrink-0', iconClass ?? 'text-slate-600')} />
        <p className="text-[15px] font-semibold text-fg">{title}</p>
      </div>
      {children}
    </div>
  )
}

function SummaryColumns({ result }) {
  const risk = RISK[result.risk_level]
  const d = result.url_details
  const patterns = result.findings.slice(0, 3)
  const modelCounted = result.findings.some((f) => f.source === 'model')

  const first = d ? (
    <Column icon={Globe} title="Domain">
      <p className={cx('font-mono text-[14px] font-semibold', d.is_official_domain ? 'text-fg' : risk.text)}>{breakable(d.hostname)}</p>
      <p className="mt-2 text-[13px] text-slate-500">Registered domain: <span className="font-medium text-slate-700">{d.registered_domain}</span></p>
      <p className="mt-0.5 text-[13px] text-slate-500">Connection: <span className="font-medium text-slate-700">{d.is_https ? 'HTTPS' : 'Not encrypted (HTTP)'}</span></p>
    </Column>
  ) : (
    <Column icon={Tag} title="Category">
      <p className={cx('text-[15px] font-semibold', result.risk_level === 'clear' ? 'text-fg' : risk.text)}>{result.scam_category}</p>
      <p className="mt-2 text-[13px] text-slate-500">{result.findings.length} indicator{result.findings.length === 1 ? '' : 's'} found</p>
    </Column>
  )

  const modelColumn = (
    <Column icon={Cpu} title="Model signal">
      {result.model_result ? (
        <>
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-semibold text-fg">{result.model_result.label}</p>
            {result.model_result.flagged ? (
              <span className="inline-flex rounded-full bg-risk-high-bg px-2 py-0.5 text-[11px] font-bold text-risk-high-fg">Flagged</span>
            ) : (
              <span className="inline-flex rounded-full bg-risk-clear-bg px-2 py-0.5 text-[11px] font-bold text-risk-clear-fg">Clear</span>
            )}
          </div>
          {result.model_result.probability != null && (
            <p className="mt-1 text-[13px] font-medium text-slate-700">
              Confidence: {(result.model_result.probability * 100).toFixed(1)}%
              {result.model_result.threshold != null && (
                <span className="text-slate-400 font-normal"> (threshold: {(result.model_result.threshold * 100).toFixed(0)}%)</span>
              )}
            </p>
          )}
          {result.model_result.flagged && !modelCounted && (
            <span className="mt-1.5 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Not counted: no supporting rule findings</span>
          )}
          <p className="mt-1.5 text-[12.5px] leading-snug text-slate-500">{result.model_result.note ?? 'Experimental classifier.'}</p>
        </>
      ) : (
        <p className="text-[13px] text-slate-500">No trained model output available.</p>
      )}
    </Column>
  )

  const third = d ? (
    <Column
      icon={d.is_official_domain ? CheckCircle2 : XCircle}
      iconClass={d.is_official_domain ? 'text-risk-clear-fg' : 'text-risk-high-fg'}
      title={d.impersonated_brand ? `Official ${capitalize(d.impersonated_brand)}?` : 'Known official domain?'}
    >
      <p className={cx('text-[28px] leading-none font-bold', d.is_official_domain ? 'text-risk-clear-fg' : 'text-risk-high-fg')}>{d.is_official_domain ? 'Yes' : 'No'}</p>
      <p className="mt-2 text-[13px] text-slate-500">
        {d.is_official_domain ? 'Matches a known official domain. Still check the full address.' : d.impersonated_brand ? `Not an official ${capitalize(d.impersonated_brand)} domain` : 'Not on our list of official domains'}
      </p>
    </Column>
  ) : (
    <Column icon={LayoutGrid} iconClass={risk.text} title="Common patterns">
      {patterns.length ? (
        <ul className="space-y-1.5">
          {patterns.map((f) => (
            <li key={f.code} className="flex gap-2 text-[13.5px] leading-snug text-slate-700">
              <span className={cx('mt-[7px] size-1.5 shrink-0 rounded-full', SEVERITY[f.severity].dot)} />
              {f.title}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13.5px] text-slate-500">No known scam patterns matched.</p>
      )}
    </Column>
  )

  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4 [&>*]:bg-surface">
      {first}
      {modelColumn}
      {third}
      <Column icon={ShieldAlert} iconClass={risk.text} title="Recommendation">
        <p className="text-[15px] font-semibold text-fg">
          {{ high: 'Do not pay or interact.', caution: 'Verify before acting.', clear: 'Proceed with normal care.' }[result.risk_level]}
        </p>
        <p className="mt-2 text-[13px] leading-snug text-slate-500">{result.recommended_actions[0]}</p>
      </Column>
    </div>
  )
}

/** Allow line breaks after dots and hyphens so domains wrap at natural points. */
const breakable = (host) => host.split(/(?<=[.-])/).map((part, i) => (
  <span key={i}>{part}<wbr /></span>
))

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export function ScanResult({ result, content, onReset }) {
  const risk = RISK[result.risk_level]
  const RiskIcon = risk.icon
  const [showLimits, setShowLimits] = useState(false)
  const isHigh = result.risk_level === 'high'

  const title = {
    url: { high: 'High risk link', caution: 'Suspicious link', clear: 'No obvious warning detected' },
    mpesa: { high: 'High risk message', caution: 'Treat this message with caution', clear: 'No obvious warning detected' },
    offer: { high: 'High risk offer', caution: 'Treat this offer with caution', clear: 'No obvious warning detected' },
  }[result.scan_type][result.risk_level]

  return (
    <section className="animate-fade-up space-y-5" aria-label="Scan result">
      {/* Headline card */}
      <div className={cx('rounded-2xl border p-5 sm:p-6', risk.bg, risk.border, isHigh && 'shadow-[0_0_0_4px_rgb(208_59_59/0.06)]')}>
        <div className="flex flex-wrap items-start gap-4 sm:gap-5">
          <div className={cx('grid size-14 shrink-0 place-items-center rounded-full text-white sm:size-16', risk.solid, isHigh && 'animate-pulse-ring')}>
            <RiskIcon className="size-7 sm:size-8" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={cx('text-[24px] leading-tight font-bold tracking-tight sm:text-[28px]', risk.text)}>{title}</h2>
            <p className="mt-1 text-[15px] text-slate-700">{result.summary} {{ high: 'Do not act on it.', caution: 'Check before you act.', clear: 'The sender is still not verified.' }[result.risk_level]}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={cx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-semibold', risk.solid, result.risk_level === 'caution' ? 'text-ink-900' : 'text-white')}>
              <RiskIcon className="size-[18px]" /> Risk level: {risk.short}
            </span>
            <ScoreRing score={result.risk_score} level={result.risk_level} />
          </div>
        </div>
        <div className="mt-5">
          <SummaryColumns result={result} />
        </div>
      </div>

      <ShareAndListen result={result} />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        {/* Findings with evidence */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="font-bold text-fg">Why this result</h3>
              <p className="text-sm text-slate-500">Each indicator and the exact wording that triggered it.</p>
            </div>
            <span className="shrink-0 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-slate-600">{result.findings.length} found</span>
          </div>

          {content && result.scan_type !== 'url' && result.findings.length > 0 && (
            <div className="border-b border-line bg-canvas/60 px-5 py-4">
              <p className="eyebrow mb-2 flex items-center gap-1.5"><FileText className="size-3.5" /> Your text with flagged phrases</p>
              <HighlightedText text={content} findings={result.findings} />
            </div>
          )}

          {result.findings.length ? (
            <ul className="divide-y divide-line">
              {result.findings.map((f, i) => (
                <li key={f.code} className="flex animate-fade-up gap-4 px-5 py-4" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={cx('mt-1.5 size-2.5 shrink-0 rounded-full', SEVERITY[f.severity].dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-semibold text-fg">{f.title}</p>
                      <span className={cx('text-xs font-semibold', SEVERITY[f.severity].text)}>{SEVERITY[f.severity].label}</span>
                      <span className="text-xs text-slate-400">{SOURCE[f.source] ?? 'Check'}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.detail}</p>
                    {f.evidence?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {f.evidence.map((e) => (
                          <code key={e} className="max-w-full truncate rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-xs text-slate-700">&ldquo;{e}&rdquo;</code>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-start gap-3 px-5 py-6 text-sm text-slate-600">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-risk-clear-fg" />
              {result.model_result?.flagged
                ? 'No rule or link check produced a warning. The model flag alone was not counted, as explained in the limitations below.'
                : 'No rule, model or link check produced a warning. This does not confirm who sent it.'}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {result.community_matches?.length > 0 && <CommunityMatches matches={result.community_matches} />}
          {result.anatomy && <Anatomy anatomy={result.anatomy} />}
          {/* Explanation */}
          <div className="card p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-bold text-fg">
                <Sparkles className="size-[18px] text-brand-ink" /> Plain-language explanation
              </h3>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                {result.explanation_source === 'llm' ? 'AI explanation' : 'Template'}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed text-slate-700">{result.explanation}</p>
            {result.explanation_source !== 'llm' && (
              <p className="mt-2 text-xs text-slate-500">Generated from the findings above. The AI explainer is unavailable, so a basic summary is shown.</p>
            )}
          </div>

          {/* Next steps */}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-fg">
              <ListChecks className="size-[18px] text-brand-ink" /> Recommended next steps
            </h3>
            <ol className="space-y-2.5">
              {result.recommended_actions.map((a, i) => (
                <li key={a} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink-900 text-xs font-bold text-white">{i + 1}</span>
                  {a}
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap gap-2">
              {result.risk_level !== 'clear' && (
                <Button as={Link} to="/app/incidents" variant={isHigh ? 'danger' : 'secondary'} size="sm" icon={LifeBuoy}>
                  I already paid or shared details
                </Button>
              )}
              <Button as={Link} to="/app/before-you-pay" variant="secondary" size="sm" icon={ListChecks}>Before You Pay checklist</Button>
              {onReset && <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onReset}>Check another</Button>}
            </div>
          </div>
        </div>
      </div>

      <FeedbackWidget key={result.id} result={result} />

      {/* Limitations + metadata */}
      <div className="card overflow-hidden">
        <button onClick={() => setShowLimits((s) => !s)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-canvas/60" aria-expanded={showLimits}>
          <span className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Info className="size-4 text-slate-500" /> Limitations of this assessment
          </span>
          <span className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">Model {result.model_version} &middot; {formatDateTime(result.created_at)}</span>
            <ChevronDown className={cx('size-4 transition-transform', showLimits && 'rotate-180')} />
          </span>
        </button>
        {showLimits && (
          <ul className="animate-fade-in space-y-1.5 border-t border-line px-5 py-4 text-sm text-slate-600">
            {result.limitations.map((l) => (
              <li key={l} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-slate-400" />{l}</li>
            ))}
            {result.risk_score_is_heuristic && (
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-slate-400" />The risk score is a heuristic based on indicator strength, not a calibrated probability.</li>
            )}
          </ul>
        )}
      </div>

      <SafetyBanner />
    </section>
  )
}

export function SafetyBanner() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 sm:flex-row sm:items-center">
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
        <Info className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-fg">When in doubt, don&rsquo;t click or pay.</p>
        <p className="text-sm text-slate-600">Report scams to protect others.</p>
      </div>
      <Link to="/app/threat-feed" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand-ink transition hover:bg-brand-100 focus-visible:shadow-glow">
        Report a scam <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}
