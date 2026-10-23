import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserRound, Lock, ArrowRight, Info } from 'lucide-react'
import { Input, Checkbox } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { USE_MOCK } from '@/lib/api'
import { AuthCard, SocialButtons } from './AuthCard'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.identifier || !form.password) return setError('Enter your email or phone number and password.')
    setLoading(true)
    setError('')
    try {
      const user = await login(form, { remember })
      toast(`Welcome back, ${user.full_name.split(' ')[0]}.`, { type: 'success' })
      navigate(location.state?.from ?? '/app', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue"
      footer={<>Don&rsquo;t have an account? <Link to="/register" className="font-semibold text-brand-ink hover:text-brand-ink hover:underline">Sign up</Link></>}
    >
      {(USE_MOCK || import.meta.env.DEV) && (
        <button
          type="button"
          onClick={() => setForm({ identifier: 'demo@trustshield254.ke', password: 'Demo@2540' })}
          className="mb-5 flex w-full items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50 p-3 text-left text-[13px] text-brand-ink transition hover:border-brand-400"
        >
          <Info className="mt-0.5 size-4 shrink-0" />
          <span><span className="font-semibold">Demo mode.</span> Click to fill the demo account: demo@trustshield254.ke / Demo@2540</span>
        </button>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Email or Phone Number" icon={UserRound} placeholder="Enter your email or phone number" autoComplete="username" value={form.identifier} onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))} />
        <Input label="Password" icon={Lock} type="password" placeholder="Enter your password" autoComplete="current-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" checked={remember} onChange={setRemember} />
          <Link to="/forgot-password" className="rounded text-sm font-semibold text-brand-ink hover:underline focus-visible:shadow-glow">
            Forgot password?
          </Link>
        </div>
        {error && <p className="animate-fade-in rounded-xl border border-risk-high-line bg-risk-high-bg px-3.5 py-2.5 text-sm font-medium text-risk-high-fg" role="alert">{error}</p>}
        <Button type="submit" size="lg" className="w-full justify-between px-5 text-[16px]" loading={loading} iconRight={ArrowRight}>
          Sign in
        </Button>
      </form>
      <SocialButtons />
    </AuthCard>
  )
}
