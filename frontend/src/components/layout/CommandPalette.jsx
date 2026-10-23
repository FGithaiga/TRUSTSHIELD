import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Moon, Sun, LogOut, CornerDownLeft } from 'lucide-react'
import { NAV } from './nav'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { cx } from '@/lib/format'

/** Ctrl/Cmd+K or "/" to jump anywhere in the app. */
export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const { resolved, toggle } = useTheme()
  const { logout } = useAuth()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const commands = useMemo(() => {
    const pages = NAV.flatMap((g) => g.items.map((i) => ({ id: i.to, group: g.section, label: i.label, icon: i.icon, keywords: i.keywords, run: () => navigate(i.to) })))
    const actions = [
      { id: 'theme', group: 'Actions', label: `Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`, icon: resolved === 'dark' ? Sun : Moon, keywords: 'dark light mode appearance', run: toggle },
      { id: 'logout', group: 'Actions', label: 'Sign out', icon: LogOut, keywords: 'log out exit', run: async () => (await logout(), navigate('/login')) },
    ]
    return [...pages, ...actions]
  }, [navigate, resolved, toggle, logout])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => `${c.label} ${c.group} ${c.keywords}`.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const run = (cmd) => {
    onClose()
    cmd.run()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)))
    else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)))
    else if (e.key === 'Enter' && results[active]) (e.preventDefault(), run(results[active]))
    else if (e.key === 'Escape') onClose()
  }

  let lastGroup = null
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search and jump">
      <div className="absolute inset-0 animate-fade-in bg-ink-950/50" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages and actions"
            className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-slate-400"
            aria-label="Search pages and actions"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `cmd-${active}` : undefined}
          />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-slate-500">Esc</kbd>
        </div>
        <ul id="palette-results" ref={listRef} role="listbox" className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-500">No matches for &ldquo;{query}&rdquo;</li>}
          {results.map((cmd, i) => {
            const Icon = cmd.icon
            const heading = cmd.group !== lastGroup ? cmd.group : null
            lastGroup = cmd.group
            return (
              <li key={cmd.id}>
                {heading && <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{heading}</p>}
                <button
                  id={`cmd-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(cmd)}
                  className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] transition-colors', i === active ? 'bg-brand-50 text-brand-ink' : 'text-fg')}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1">{cmd.label}</span>
                  {i === active && <CornerDownLeft className="size-4 opacity-70" />}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-slate-500">
          <span><kbd className="font-mono">Up</kbd> / <kbd className="font-mono">Down</kbd> to move</span>
          <span><kbd className="font-mono">Enter</kbd> to open</span>
        </div>
      </div>
    </div>
  )
}
