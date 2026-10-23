import { useEffect, useState } from 'react'
import { Volume2, Square, Share2, Copy, MessageCircle } from 'lucide-react'
import { RISK } from '@/lib/constants'
import { useToast } from '@/context/ToastContext'
import { cx } from '@/lib/format'

const NOUN = { mpesa: 'message', url: 'link', offer: 'offer' }

/** A privacy-safe summary: no original text, numbers or links, only the assessment. */
export function shareText(result) {
  const risk = RISK[result.risk_level]
  const signs = result.findings.slice(0, 3).map((f) => `- ${f.title}`)
  return [
    `I checked a ${NOUN[result.scan_type]} on TrustShield 254.`,
    `Result: ${risk.label.toUpperCase()}${result.scam_category !== 'No category' ? ` (${result.scam_category})` : ''}.`,
    signs.length ? `Warning signs:\n${signs.join('\n')}` : null,
    `Advice: ${result.recommended_actions[0]}`,
    'Can we talk before I do anything with it?',
  ].filter(Boolean).join('\n\n')
}

function speechText(result) {
  const risk = RISK[result.risk_level]
  const steps = result.recommended_actions.map((a, i) => `Step ${i + 1}. ${a}`).join(' ')
  return `${risk.label}. ${result.summary} ${result.explanation} Recommended next steps. ${steps}`
}

export function ShareAndListen({ result }) {
  const toast = useToast()
  const [speaking, setSpeaking] = useState(false)
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => () => canSpeak && window.speechSynthesis.cancel(), [canSpeak])

  const listen = () => {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(speechText(result))
    const voices = window.speechSynthesis.getVoices()
    utterance.voice = voices.find((v) => v.lang === 'en-KE') || voices.find((v) => v.lang === 'en-GB') || voices.find((v) => v.lang.startsWith('en')) || null
    utterance.rate = 0.95
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText(result))
      toast('Summary copied. Paste it to someone you trust.', { type: 'success' })
    } catch {
      toast('Copy failed. Your browser blocked clipboard access.', { type: 'error' })
    }
  }

  const nativeShare = () => navigator.share({ title: 'TrustShield 254 check', text: shareText(result) }).catch(() => {})

  const btn = 'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-150 focus-visible:shadow-glow active:scale-[0.98]'

  return (
    <div className="card flex flex-wrap items-center gap-x-5 gap-y-3 p-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="font-bold text-fg">Ask someone you trust</p>
        <p className="text-[13px] text-slate-500">Share a safe summary before you act. Your message text is never included.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText(result))}`}
          target="_blank"
          rel="noreferrer noopener"
          className={cx(btn, 'border-risk-clear bg-risk-clear text-white hover:bg-risk-clear/90')}
        >
          <MessageCircle className="size-4" /> WhatsApp
        </a>
        {canShare && (
          <button onClick={nativeShare} className={cx(btn, 'border-line-strong bg-surface text-fg hover:bg-slate-50')}>
            <Share2 className="size-4" /> Share
          </button>
        )}
        <button onClick={copy} className={cx(btn, 'border-line-strong bg-surface text-fg hover:bg-slate-50')}>
          <Copy className="size-4" /> Copy
        </button>
        {canSpeak && (
          <button onClick={listen} aria-pressed={speaking} className={cx(btn, speaking ? 'border-brand-600 bg-brand-50 text-brand-ink' : 'border-line-strong bg-surface text-fg hover:bg-slate-50')}>
            {speaking ? <Square className="size-4" /> : <Volume2 className="size-4" />}
            {speaking ? 'Stop reading' : 'Read aloud'}
            {speaking && (
              <span className="flex items-end gap-0.5" aria-hidden="true">
                {[0, 1, 2].map((i) => <span key={i} className="w-0.5 animate-shimmer rounded-full bg-brand-600" style={{ height: 6 + i * 3, animationDelay: `${i * 150}ms` }} />)}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
