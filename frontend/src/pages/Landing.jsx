import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Smartphone, Link2, BadgePercent, ListChecks, LifeBuoy, ShieldAlert,
  ClipboardPaste, ScanSearch, MessageSquareText, Route, CameraOff, KeyRound, EyeOff, Globe, Check,
  ScanText, UsersRound, GraduationCap, HeartHandshake, Menu, X,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Skyline } from '@/components/brand/Art'
import { Button } from '@/components/ui/Button'
import { RISK } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'
import { PulseCard } from '@/components/community/PulseCard'
import { cx } from '@/lib/format'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useRevealOnScroll } from '@/components/ui/Motion'

const FEATURES = [
  { icon: Smartphone, title: 'M-PESA Scam Checker', text: 'Fake reversals, PIN requests, prize scams and risky payment requests.', primary: true },
  { icon: Link2, title: 'Link Checker', text: 'Spots look-alike and risky links without opening them.' },
  { icon: BadgePercent, title: 'Offer Checker', text: 'Fake jobs, shopping deals and investment promises.' },
  { icon: ListChecks, title: 'Before You Pay', text: 'A quick checklist before any payment.' },
  { icon: LifeBuoy, title: 'Incident Assistant', text: 'What to do, and who to call, if you were scammed.' },
]

const STEPS = [
  { icon: ClipboardPaste, title: 'Input', text: 'Paste a message, link or offer.' },
  { icon: ScanSearch, title: 'Analyze', text: 'Rules and ML models check it.' },
  { icon: MessageSquareText, title: 'Explain', text: 'See the warning signs in plain words.' },
  { icon: Route, title: 'Act', text: 'Get clear next steps.' },
]

const DIFFERENT = [
  { icon: ScanText, title: 'M-PESA message anatomy', text: 'Checks a "Confirmed" message against the real M-PESA format.' },
  { icon: UsersRound, title: 'Seen before', text: 'Warns you when others flagged the same number or link.' },
  { icon: HeartHandshake, title: 'Ask someone you trust', text: 'Share a safe summary with family on WhatsApp.' },
  { icon: GraduationCap, title: 'Scam Sense Trainer', text: 'Sharpen your instincts in one minute a day.' },
]

const PRIVACY = [
  { icon: CameraOff, text: 'No camera, contacts or SMS access' },
  { icon: KeyRound, text: 'Never asks for your PIN or OTP' },
  { icon: EyeOff, text: 'Messages not saved by default' },
  { icon: Globe, text: 'Links checked, never opened' },
]

function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[420px] lg:mx-0">
      {/* Phone */}
      <div className="relative mx-auto w-[290px] rounded-[42px] border-[10px] border-ink-950 bg-ink-950 shadow-[0_40px_80px_-24px_rgb(0_0_0/0.7)]">
        <div className="overflow-hidden rounded-[32px] bg-canvas">
          <div className="flex items-center justify-between bg-surface px-5 pt-3 pb-2 text-[11px] font-semibold text-fg">
            <span>9:41</span>
            <span className="h-4 w-16 rounded-full bg-ink-950" />
            <span>4G</span>
          </div>
          <div className="border-b border-line bg-surface px-4 pb-3 text-center">
            <p className="text-[13px] font-bold text-fg">+254 7XX XXX 111</p>
            <p className="text-[10px] text-slate-500">Text message</p>
          </div>
          <div className="space-y-3 px-3 py-4">
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface p-3 text-[12.5px] leading-relaxed text-fg shadow-sm">
              Confirmed. You have received Ksh 3,500.00 from JOHN K. Hello, I sent this{' '}
              <mark className="rounded bg-risk-high/15 px-0.5 font-semibold text-risk-high-fg underline decoration-risk-high/50 decoration-2 underline-offset-2">by mistake</mark>, please{' '}
              <mark className="rounded bg-risk-high/15 px-0.5 font-semibold text-risk-high-fg underline decoration-risk-high/50 decoration-2 underline-offset-2">reverse it</mark>{' '}
              to 07XX XXX 111{' '}
              <mark className="rounded bg-risk-caution-dot/25 px-0.5 font-semibold text-risk-caution-fg underline decoration-risk-caution-dot decoration-2 underline-offset-2">urgently</mark>.
            </div>
            <p className="pl-1 text-[10px] text-slate-400">Today 9:41 PM</p>
            <div className="h-28" />
          </div>
        </div>
      </div>

      {/* Floating result */}
      <div className="absolute -bottom-6 left-0 w-[268px] animate-fade-up rounded-2xl border border-risk-high-line bg-surface p-4 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.45)] [animation-delay:400ms] sm:-left-6 lg:-left-14">
        <div className="flex items-center gap-3">
          <span className="grid size-10 animate-pulse-ring place-items-center rounded-full bg-risk-high text-white"><ShieldAlert className="size-5" /></span>
          <div className="flex-1">
            <p className="font-bold text-risk-high-fg">High risk</p>
            <p className="text-xs text-slate-500">Fake reversal request</p>
          </div>
          <span className="text-2xl font-bold text-fg">87</span>
        </div>
        <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-[12.5px] text-slate-700">
          {['Asks you to reverse a payment', 'Creates urgency', 'Personal number to pay'].map((t, i) => (
            <li key={t} className="flex items-center gap-2"><span className={cx('size-1.5 rounded-full', i < 1 ? 'bg-risk-high' : 'bg-risk-caution-dot')} />{t}</li>
          ))}
        </ul>
      </div>

      <div className="absolute top-10 -right-2 hidden w-[200px] animate-fade-up rounded-2xl border border-line bg-surface p-3.5 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.45)] [animation-delay:600ms] sm:block lg:-right-10">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Next step</p>
        <p className="mt-1 text-[13px] leading-snug font-semibold text-fg">Check your M-PESA balance directly. Do not send money back.</p>
      </div>
    </div>
  )
}

export default function Landing() {
  const { status } = useAuth()
  const authed = status === 'authenticated'
  const [menu, setMenu] = useState(false)
  useRevealOnScroll()

  useEffect(() => {
    const close = (e) => e.key === 'Escape' && setMenu(false)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="rounded-lg focus-visible:shadow-glow"><Logo variant="dark" subtitle={null} /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {[['#features', 'Features'], ['#how', 'How it works'], ['#privacy', 'Privacy']].map(([href, label]) => (
              <a key={href} href={href} className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-mist-300 transition hover:bg-white/[0.06] hover:text-white">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle tone="dark" />
            {authed ? (
              <span className="hidden sm:block"><Button as={Link} to="/app" size="sm" iconRight={ArrowRight}>Open dashboard</Button></span>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-lg px-3.5 py-2 text-[15px] font-semibold text-white transition hover:bg-white/[0.06] sm:block">Sign in</Link>
                <span className="hidden sm:block"><Button as={Link} to="/register" size="sm">Get started</Button></span>
              </>
            )}
            <button onClick={() => setMenu((m) => !m)} className="grid size-10 place-items-center rounded-xl text-white hover:bg-white/[0.08] md:hidden" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}>
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="animate-fade-in border-t border-white/10 bg-ink-900 px-5 pb-5 md:hidden">
            <nav className="flex flex-col py-2" aria-label="Sections">
              {[['#features', 'Features'], ['#how', 'How it works'], ['#privacy', 'Privacy']].map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMenu(false)} className="rounded-lg px-2 py-3 text-base font-medium text-mist-200 hover:bg-white/[0.06] hover:text-white">{label}</a>
              ))}
            </nav>
            <div className="grid grid-cols-2 gap-2">
              {authed ? (
                <Button as={Link} to="/app" className="col-span-2" iconRight={ArrowRight}>Open dashboard</Button>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="outlineDark">Sign in</Button>
                  <Button as={Link} to="/register">Get started</Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="dot-grid relative overflow-hidden bg-ink-900 text-white">
        <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] w-full opacity-70" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-16 px-5 pt-16 pb-24 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-24 lg:pb-32">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-semibold text-mist-200">
              <span className="size-1.5 rounded-full bg-mint-400" /> Kenya-focused fraud prevention
            </span>
            <h1 className="mt-6 text-[48px] leading-[1.02] font-extrabold tracking-tight sm:text-[64px]">
              Verify before<br /><span className="text-mint-300">you pay.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist-300">
              Paste a suspicious M-PESA message, link or offer. See the warning signs and your safest next step in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to={authed ? '/app/mpesa' : '/register'} size="lg" iconRight={ArrowRight}>Check a message</Button>
              <Button as={Link} to={authed ? '/app/before-you-pay' : '/login'} size="lg" variant="outlineDark">
                {authed ? 'Before You Pay checklist' : 'Sign in'}
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist-300">
              {['Free to use', 'No app permissions', 'Explains every result'].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="size-4 text-mint-400" strokeWidth={3} />{t}</li>
              ))}
            </ul>
          </div>
          <PhoneMock />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-canvas py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="reveal max-w-2xl">
            <p className="eyebrow text-brand-ink">What you can check</p>
            <h2 className="mt-2 text-[34px] leading-tight font-bold tracking-tight sm:text-[40px]">One place to check before you trust.</h2>
            <p className="mt-3 text-lg text-slate-600">Built for the scams Kenyans see every day.</p>
          </div>
          <div className="reveal-stagger mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, primary }) => (
              <div
                key={title}
                className={cx(
                  'group rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1',
                  primary ? 'border-ink-900 bg-ink-900 text-white hover:shadow-[0_0_0_4px_rgb(40_104_215/0.25),0_20px_40px_-16px_rgb(16_36_58/0.5)] lg:row-span-2 lg:flex lg:flex-col' : 'border-line bg-surface shadow-card hover:border-brand-200 hover:shadow-[0_0_0_4px_rgb(40_104_215/0.08),0_16px_36px_-14px_rgb(16_36_58/0.2)]',
                )}
              >
                <span className={cx('grid size-12 place-items-center rounded-xl transition-colors', primary ? 'bg-brand-600' : 'bg-brand-50 text-brand-ink group-hover:bg-brand-600 group-hover:text-white')}>
                  <Icon className="size-6" />
                </span>
                {primary && <span className="mt-5 inline-flex w-fit rounded-full bg-mint-400/15 px-2.5 py-0.5 text-xs font-semibold text-mint-300">Primary feature</span>}
                <h3 className={cx('text-lg font-bold', primary ? 'mt-3' : 'mt-5')}>{title}</h3>
                <p className={cx('mt-2 leading-relaxed', primary ? 'text-mist-300' : 'text-slate-600')}>{text}</p>
                {primary && (
                  <div className="mt-6 space-y-2 lg:mt-auto">
                    {['Fake reversal', 'PIN or OTP request', 'Prize scam', 'Payment instruction'].map((t) => (
                      <div key={t} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm">
                        {t}<ShieldAlert className="size-4 text-risk-high-fg" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes it different */}
      <section className="border-y border-line bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="reveal max-w-2xl">
            <p className="eyebrow text-brand-ink">Built differently</p>
            <h2 className="mt-2 text-[34px] leading-tight font-bold tracking-tight sm:text-[40px]">More than a verdict.</h2>
          </div>
          <div className="reveal-stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENT.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="group relative rounded-2xl border border-line bg-canvas p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-surface hover:shadow-[0_0_0_4px_rgb(40_104_215/0.08),0_16px_36px_-14px_rgb(16_36_58/0.2)]">
                <span className="absolute top-5 right-5 font-mono text-xs font-semibold text-slate-400">0{i + 1}</span>
                <span className="grid size-12 place-items-center rounded-xl bg-ink-900 transition-colors group-hover:bg-brand-600"><Icon className="size-6 text-mint-300 group-hover:text-white" /></span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="eyebrow text-brand-ink">How it works</p>
            <h2 className="mt-2 text-[34px] leading-tight font-bold tracking-tight sm:text-[40px]">From suspicious text to a safe next step.</h2>
          </div>
          <ol className="reveal-stagger relative mt-12 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-14 md:grid-cols-4">
            <span className="absolute top-7 right-[10%] left-[10%] hidden h-0.5 bg-line md:block" aria-hidden="true" />
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative text-center">
                <span className="relative mx-auto grid size-14 place-items-center rounded-2xl border border-line bg-surface text-fg shadow-card">
                  <Icon className="size-6" />
                  <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                </span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mx-auto mt-1 max-w-[220px] text-sm leading-relaxed text-slate-600">{text}</p>
              </li>
            ))}
          </ol>

          {/* Risk categories */}
          <div className="reveal-stagger mt-20 grid gap-4 md:grid-cols-3">
            {Object.values(RISK).map((r) => {
              const Icon = r.icon
              return (
                <div key={r.key} className={cx('rounded-2xl border p-6', r.bg, r.border)}>
                  <div className="flex items-center gap-3">
                    <span className={cx('grid size-10 place-items-center rounded-full text-white', r.solid)}><Icon className="size-5" /></span>
                    <h3 className={cx('font-bold', r.text)}>{r.label}</h3>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-700">{r.meaning}</p>
                </div>
              )
            })}
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-slate-500">
            A risk check, not proof. Always confirm payments on your own phone.
          </p>
        </div>
      </section>

      {/* Live pulse */}
      <section className="dot-grid bg-ink-900 py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_440px]">
          <div>
            <p className="eyebrow text-mint-300">Live from the community</p>
            <h2 className="mt-2 text-[34px] leading-tight font-bold tracking-tight sm:text-[40px]">What scams are going around this week.</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-mist-300">
              Anonymous trends from checks across Kenya.
            </p>
          </div>
          <PulseCard dark />
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-20 border-t border-white/10 bg-ink-800 py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-mint-300">Privacy by design</p>
            <h2 className="mt-2 text-[34px] leading-tight font-bold tracking-tight sm:text-[40px]">Your data stays yours.</h2>
            <p className="mt-4 text-lg leading-relaxed text-mist-300">We only see what you paste, and never need your secrets.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PRIVACY.map(({ icon: Icon, text }) => (
              <li key={text} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20 hover:bg-white/[0.07]">
                <Icon className="size-6 text-mint-300" />
                <p className="mt-3 font-semibold leading-snug">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-[30px] font-bold tracking-tight">Got a message that does not feel right?</h2>
            <p className="mt-1 text-lg text-slate-600">Check it in seconds.</p>
          </div>
          <Button as={Link} to={authed ? '/app/mpesa' : '/register'} size="lg" iconRight={ArrowRight}>Start checking</Button>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:px-8">
          <Logo subtitle={null} className="scale-90 origin-left" />
          <p>Detect. Explain. Protect. &middot; Experimental prototype, not a substitute for official verification.</p>
          <p>&copy; {new Date().getFullYear()} TrustShield 254</p>
        </div>
      </footer>
    </div>
  )
}
