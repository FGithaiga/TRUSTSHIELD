import { LogoMark } from '@/components/brand/Logo'
import { GoogleMark, MicrosoftMark } from '@/components/brand/Art'
import { useToast } from '@/context/ToastContext'

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-9">
      <div className="mb-6 text-center sm:mb-7">
        <div className="mx-auto mb-4 hidden size-[72px] place-items-center sm:grid"><LogoMark className="size-[72px]" /></div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">{title}</h1>
        <p className="mt-1 text-[15px] text-slate-500">{subtitle}</p>
      </div>
      {children}
      {footer && <p className="mt-7 text-center text-[15px] text-slate-600">{footer}</p>}
    </div>
  )
}

// Shown only once OAuth is configured on the backend; until then the buttons would do nothing.
const SOCIAL_ENABLED = import.meta.env.VITE_ENABLE_SOCIAL_LOGIN === 'true'

export function SocialButtons() {
  const toast = useToast()
  if (!SOCIAL_ENABLED) return null
  const notReady = (provider) => toast(`${provider} sign-in will be available once the backend OAuth setup is complete.`, { type: 'info' })
  const cls = 'flex h-12 items-center justify-center gap-2.5 rounded-xl border border-line-strong bg-surface text-[15px] font-semibold text-fg transition hover:border-slate-400 hover:bg-slate-50 focus-visible:shadow-glow active:scale-[0.98]'
  return (
    <>
      <div className="my-6 flex items-center gap-3 text-sm text-slate-500">
        <span className="h-px flex-1 bg-line" /> or continue with <span className="h-px flex-1 bg-line" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={cls} onClick={() => notReady('Google')}><GoogleMark /> Google</button>
        <button type="button" className={cls} onClick={() => notReady('Microsoft')}><MicrosoftMark /> Microsoft</button>
      </div>
    </>
  )
}
