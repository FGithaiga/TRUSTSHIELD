import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserRound, Mail, Phone, Lock, ArrowRight } from 'lucide-react'
import { Input, Checkbox } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { cx } from '@/lib/format'
import { AuthCard, SocialButtons } from './AuthCard'

function strength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++
  return s
}
const LEVELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = ['bg-slate-200', 'bg-risk-high', 'bg-risk-caution-dot', 'bg-brand-500', 'bg-risk-clear-dot']

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => (setForm((f) => ({ ...f, [k]: e.target.value })), setErrors((er) => ({ ...er, [k]: undefined })))
  const s = strength(form.password)

  const submit = async (e) => {
    e.preventDefault()
    if (!agree) return setErrors({ agree: 'Please accept the terms to continue.' })
    setLoading(true)
    try {
      const user = await register(form)
      toast(`Your account is ready, ${user.full_name.split(' ')[0]}.`, { type: 'success', title: 'Welcome to TrustShield 254' })
      navigate('/app', { replace: true })
    } catch (err) {
      setErrors(Object.keys(err.fields).length ? Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, v[0]])) : { form: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start checking messages, links and offers"
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-ink hover:text-brand-ink hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Full name" icon={UserRound} placeholder="Your name" autoComplete="name" value={form.full_name} onChange={set('full_name')} error={errors.full_name} />
        <Input label="Email" icon={Mail} type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Input label="Phone number" icon={Phone} type="tel" placeholder="Optional" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <div>
          <Input label="Password" icon={Lock} type="password" placeholder="At least 8 characters" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
          {form.password && (
            <div className="mt-2 flex animate-fade-in items-center gap-3">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => <span key={i} className={cx('h-1.5 flex-1 rounded-full transition-colors duration-300', i <= s ? COLORS[s] : 'bg-slate-200')} />)}
              </div>
              <span className="w-16 text-right text-xs font-semibold text-slate-500">{LEVELS[s]}</span>
            </div>
          )}
        </div>
        <div>
          <Checkbox checked={agree} onChange={(v) => (setAgree(v), setErrors((er) => ({ ...er, agree: undefined })))} label="I understand TrustShield 254 gives risk assessments, not guarantees." />
          {errors.agree && <p className="mt-1.5 text-[13px] font-medium text-risk-high-fg">{errors.agree}</p>}
        </div>
        {errors.form && <p className="rounded-xl border border-risk-high-line bg-risk-high-bg px-3.5 py-2.5 text-sm font-medium text-risk-high-fg" role="alert">{errors.form}</p>}
        <Button type="submit" size="lg" className="w-full justify-between px-5 text-[16px]" loading={loading} iconRight={ArrowRight}>Create account</Button>
      </form>
      <SocialButtons />
    </AuthCard>
  )
}
