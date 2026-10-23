import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Smartphone, Link2, GraduationCap, Menu } from 'lucide-react'
import { cx } from '@/lib/format'

const TABS = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/mpesa', label: 'M-PESA', icon: Smartphone },
  { to: '/app/links', label: 'Links', icon: Link2 },
  { to: '/app/trainer', label: 'Trainer', icon: GraduationCap },
]

/** Thumb-reachable tab bar for phones and small tablets. */
export function MobileNav({ onMore }) {
  const tab = 'relative flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[11px] font-semibold transition-colors focus-visible:shadow-glow'
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden" aria-label="Quick navigation">
      <div className="mx-auto flex max-w-lg">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cx(tab, isActive ? 'text-brand-ink' : 'text-slate-500 hover:text-fg')}>
            {({ isActive }) => (
              <>
                <span className={cx('absolute top-0 h-0.5 w-8 rounded-full bg-brand-600 transition-all duration-300', isActive ? 'opacity-100' : 'scale-x-0 opacity-0')} />
                <Icon className={cx('size-[22px] transition-transform duration-200', isActive && '-translate-y-0.5')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button onClick={onMore} className={cx(tab, 'text-slate-500 hover:text-fg')}>
          <Menu className="size-[22px]" />
          More
        </button>
      </div>
    </nav>
  )
}
