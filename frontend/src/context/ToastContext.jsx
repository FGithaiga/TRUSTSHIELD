import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cx } from '@/lib/format'

const ToastContext = createContext(null)

const STYLES = {
  success: { icon: CheckCircle2, color: 'text-risk-clear-fg' },
  error: { icon: XCircle, color: 'text-risk-high-fg' },
  info: { icon: Info, color: 'text-brand-ink' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (message, { type = 'info', title } = {}) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t.slice(-3), { id, message, type, title }])
      setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-24 z-[100] lg:bottom-4 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const { icon: Icon, color } = STYLES[t.type]
          return (
            <div key={t.id} className="pointer-events-auto flex animate-slide-in-right items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-lift">
              <Icon className={cx('mt-0.5 size-5 shrink-0', color)} />
              <div className="min-w-0 flex-1 text-sm">
                {t.title && <p className="font-semibold text-fg">{t.title}</p>}
                <p className="text-slate-600">{t.message}</p>
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
