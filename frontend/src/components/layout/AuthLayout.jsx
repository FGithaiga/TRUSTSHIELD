import { Link, Outlet } from 'react-router-dom'
import { Smartphone, Link2, BadgePercent, Wallet, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Logo } from '@/components/brand/Logo'
import { KenyaFlag, Skyline } from '@/components/brand/Art'

const FEATURES = [
  { icon: Smartphone, title: 'M-PESA Checker', text: 'Fake reversals and PIN requests' },
  { icon: Link2, title: 'Link Checker', text: 'Look-alike and risky links' },
  { icon: BadgePercent, title: 'Offer Checker', text: 'Fake jobs and deals' },
  { icon: Wallet, title: 'Before You Pay', text: 'A quick payment checklist' },
]

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4 sm:h-[72px] sm:px-8">
        <div className="flex items-center gap-5">
          <Link to="/" className="rounded-lg focus-visible:shadow-glow"><Logo subtitle={null} /></Link>
          <div className="hidden h-8 w-px bg-line sm:block" />
          <span className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-[15px] font-medium text-fg sm:flex">
            <KenyaFlag className="h-4 w-6 rounded-[2px] shadow-[0_0_0_1px_rgb(0_0_0/0.1)]" /> Kenya
          </span>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden items-center gap-2 text-[15px] font-medium text-fg md:flex">
            <ShieldCheck className="size-5 text-fg" /> Your safety. Our shield.
          </p>
          <ThemeToggle />
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[1.12fr_1fr]">
        {/* Hero: a compact band above the form on phones and tablets, a full panel on desktop */}
        <section className="dot-grid relative flex flex-col overflow-hidden bg-ink-900 px-5 pt-8 pb-7 text-white sm:px-8 sm:pt-10 lg:px-10 lg:pt-14 lg:pb-10 xl:px-14">
          <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] w-full opacity-60 lg:h-[46%] lg:opacity-90" />
          <div className="relative">
            <p className="text-[34px] leading-[1.06] font-extrabold tracking-tight sm:text-[44px] lg:text-[52px] xl:text-[60px]">
              Spot scams.<br />Stay safe.<br />
              <span className="text-mint-300">Make smarter decisions.</span>
            </p>
            <p className="mt-3 max-w-md text-base leading-relaxed text-mist-300 sm:text-lg lg:mt-6">
              Check before you send, click or trust. <span className="font-semibold text-mint-300">Simple. Secure. Kenyan.</span>
            </p>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:mt-10 lg:gap-3 xl:gap-4">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="group flex animate-fade-up items-center gap-2.5 rounded-xl border border-white/15 bg-surface/95 p-2.5 text-fg shadow-[0_12px_32px_-12px_rgb(0_0_0/0.5)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgb(90_143_227/0.6),0_16px_40px_-12px_rgb(40_104_215/0.55)] lg:flex-col lg:rounded-2xl lg:p-4 lg:text-center"
                style={{ animationDelay: `${150 + i * 70}ms` }}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition-transform duration-200 group-hover:scale-105 lg:size-14">
                  <Icon className="size-4 lg:size-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] leading-tight font-bold sm:text-sm lg:mt-1 lg:text-[15px]">{title}</p>
                  <p className="mt-1 hidden text-[12.5px] leading-snug text-slate-600 lg:block">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-auto hidden items-center gap-3 pt-10 lg:flex">
            <ShieldCheck className="size-9 text-mint-300" strokeWidth={1.6} />
            <p className="font-semibold text-mint-300">Built in Kenya, for your safety.</p>
          </div>
        </section>

        {/* Form */}
        <section className="line-grid flex items-start justify-center bg-canvas px-4 py-8 sm:px-8 sm:py-10 lg:items-center">
          <div className="w-full max-w-[440px] animate-fade-up">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  )
}
