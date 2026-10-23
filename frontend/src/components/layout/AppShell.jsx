import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, ChevronDown, UserRound, ShieldCheck, Search, ChevronRight } from 'lucide-react'
import { Logo, LogoMark } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NAV, locate } from './nav'
import { CommandPalette } from './CommandPalette'
import { MobileNav } from './MobileNav'
import { useAuth } from '@/context/AuthContext'
import { api, USE_MOCK } from '@/lib/api'
import { cx, initials } from '@/lib/format'

function Sidebar({ onNavigate }) {
  return (
    <div className="dot-grid flex h-full flex-col bg-ink-900">
      <div className="px-6 pt-6 pb-5">
        <Link to="/app" onClick={onNavigate} className="inline-block rounded-lg focus-visible:shadow-glow">
          <Logo variant="dark" />
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-4 pb-6" aria-label="Main">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.14em] text-mist-500 uppercase">{group.section}</p>
            <ul className="space-y-1">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all duration-150 focus-visible:shadow-glow',
                        isActive
                          ? 'bg-brand-600 text-white shadow-glow-strong'
                          : 'text-mist-300 hover:bg-white/[0.06] hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cx('size-[19px] shrink-0 transition-transform duration-150', !isActive && 'group-hover:scale-110')} />
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mx-4 mb-4 border-t border-white/10 pt-4">
        <div className="flex items-start gap-3 rounded-xl bg-ink-800 p-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-mint-300" />
          <div className="text-xs">
            <p className="font-semibold text-white">Privacy first</p>
            <p className="mt-0.5 leading-relaxed text-mist-400">We never ask for your PIN, password or OTP. Message text is not saved by default.</p>
          </div>
        </div>
        <p className="mt-4 px-2 text-[11px] text-mist-500">&copy; {new Date().getFullYear()} TrustShield 254</p>
      </div>
    </div>
  )
}

function ServiceStatus() {
  const [state, setState] = useState('checking')
  useEffect(() => {
    let timer
    const check = () =>
      api
        .health()
        .then((h) => {
          const next = h.mode === 'mock' ? 'mock' : h.models_loaded ? 'online' : h.model_error ? 'rules' : 'loading'
          setState(next)
          // Models load in the background after the server starts; poll until they are ready.
          if (next === 'loading') timer = setTimeout(check, 3000)
        })
        .catch(() => setState('offline'))
    check()
    return () => clearTimeout(timer)
  }, [])
  const map = {
    checking: ['bg-slate-300', 'Checking service'],
    online: ['bg-risk-clear-dot', 'Analysis service online'],
    loading: ['bg-risk-caution-dot', 'Loading ML models'],
    rules: ['bg-risk-caution-dot', 'Rule checks only'],
    mock: ['bg-risk-caution-dot', 'Demo mode: mock API'],
    offline: ['bg-risk-high', 'Service unavailable'],
  }
  const [dot, text] = map[USE_MOCK && state === 'checking' ? 'mock' : state]
  return (
    <div className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-slate-600 xl:flex" title={text}>
      <span className="relative flex size-2">
        {state === 'online' && <span className="absolute inline-flex size-full animate-ping rounded-full bg-risk-clear-dot opacity-60" />}
        <span className={cx('relative inline-flex size-2 rounded-full', dot)} />
      </span>
      {text}
    </div>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-xl py-1 pr-2 pl-1 transition hover:bg-slate-100 focus-visible:shadow-glow" aria-expanded={open} aria-haspopup="menu">
        <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{initials(user?.full_name)}</span>
        <span className="hidden text-left md:block">
          <span className="block text-sm leading-tight font-semibold text-fg">{user?.full_name}</span>
          <span className="block text-xs leading-tight text-slate-500">{user?.email}</span>
        </span>
        <ChevronDown className={cx('hidden size-4 text-slate-500 transition-transform sm:block', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-scale-in rounded-xl border border-line bg-surface p-1.5 shadow-lift">
          <div className="border-b border-line px-3 pt-2 pb-3 md:hidden">
            <p className="text-sm font-semibold">{user?.full_name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button role="menuitem" onClick={() => (setOpen(false), navigate('/app/settings'))} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            <UserRound className="size-4" /> Profile and settings
          </button>
          <button role="menuitem" onClick={async () => (await logout(), navigate('/login'))} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-risk-high-fg hover:bg-risk-high-bg">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function Breadcrumb() {
  const { pathname } = useLocation()
  const here = locate(pathname)
  if (!here) return null
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm lg:flex">
      <span className="text-slate-500">{here.section}</span>
      <ChevronRight className="size-4 shrink-0 text-slate-400" />
      {here.detail ? (
        <>
          <Link to={here.item.to} className="rounded font-medium text-slate-600 hover:text-fg focus-visible:shadow-glow">{here.item.label}</Link>
          <ChevronRight className="size-4 shrink-0 text-slate-400" />
          <span className="truncate font-semibold text-fg" aria-current="page">Details</span>
        </>
      ) : (
        <span className="truncate font-semibold text-fg" aria-current="page">{here.item.label}</span>
      )}
    </nav>
  )
}

export function AppShell() {
  const [drawer, setDrawer] = useState(false)
  const [palette, setPalette] = useState(false)
  const location = useLocation()
  const mainRef = useRef(null)

  // Every page starts at the top; focus moves to the content for screen-reader users.
  useEffect(() => {
    setDrawer(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = drawer || palette ? 'hidden' : ''
  }, [drawer, palette])

  useEffect(() => {
    const onKey = (e) => {
      const typing = e.target.closest('input, textarea, select, [contenteditable="true"]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setPalette(true)
      }
      if (e.key === 'Escape') setDrawer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only z-[70] rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] border-r border-white/5 lg:block">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink-950/60" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(300px,86vw)] animate-slide-in-left shadow-lift">
            <Sidebar onNavigate={() => setDrawer(false)} />
            <button onClick={() => setDrawer(false)} className="absolute top-5 right-3 grid size-10 place-items-center rounded-lg text-mist-300 hover:bg-white/10" aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <CommandPalette open={palette} onClose={() => setPalette(false)} />

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
            {/* Phones open the menu from the bottom bar's More tab; tablets keep it here. */}
            <button onClick={() => setDrawer(true)} className="hidden size-10 place-items-center rounded-xl text-fg hover:bg-slate-100 sm:grid lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <Link to="/app" className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:shadow-glow lg:hidden">
              <LogoMark className="size-7 shrink-0" />
              <span className="truncate text-[17px] font-extrabold tracking-tight">TrustShield<span className="text-brand-ink"> 254</span></span>
            </Link>
            <Breadcrumb />
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setPalette(true)}
                className="hidden h-10 items-center gap-2 rounded-xl border border-line bg-surface pr-2 pl-3 text-sm text-slate-500 transition hover:border-line-strong hover:text-fg focus-visible:shadow-glow md:flex"
                aria-label="Search pages and actions"
              >
                <Search className="size-4" />
                <span className="w-28 text-left">Jump to...</span>
                <kbd className="rounded-md border border-line px-1.5 font-mono text-[11px]">Ctrl K</kbd>
              </button>
              <button onClick={() => setPalette(true)} className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Search pages and actions">
                <Search className="size-5" />
              </button>
              <ServiceStatus />
              <ThemeToggle />
              <div className="hidden h-7 w-px bg-line sm:block" />
              <UserMenu />
            </div>
          </div>
        </header>
        <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-[1240px] px-4 pt-6 pb-28 outline-none sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          <div key={location.pathname} className="animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav onMore={() => setDrawer(true)} />
    </div>
  )
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-fg sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}
