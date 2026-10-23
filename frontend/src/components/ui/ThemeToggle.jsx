import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { cx } from '@/lib/format'

/** Icon button that flips between light and dark. `tone="dark"` for navy headers. */
export function ThemeToggle({ tone = 'light', className }) {
  const { resolved, toggle } = useTheme()
  const next = resolved === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cx(
        'relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl transition-colors focus-visible:shadow-glow',
        tone === 'dark' ? 'text-mist-200 hover:bg-white/[0.08] hover:text-white' : 'border border-line bg-surface text-slate-600 hover:text-fg',
        className,
      )}
    >
      <Sun className={cx('absolute size-[18px] transition-all duration-300', resolved === 'dark' ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100')} />
      <Moon className={cx('absolute size-[18px] transition-all duration-300', resolved === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0')} />
    </button>
  )
}

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/** Three-way picker for Settings. */
export function ThemePicker() {
  const { preference, setTheme } = useTheme()
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={preference === value}
          onClick={() => setTheme(value)}
          className={cx(
            'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-semibold transition-all duration-150 focus-visible:shadow-glow',
            preference === value ? 'border-brand-500 bg-brand-50 text-brand-ink shadow-[0_0_0_4px_rgb(40_104_215/0.1)]' : 'border-line text-slate-600 hover:border-line-strong hover:text-fg',
          )}
        >
          <Icon className="size-5" />
          {label}
        </button>
      ))}
    </div>
  )
}
