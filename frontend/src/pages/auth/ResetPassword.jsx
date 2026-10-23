import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, KeyRound, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { AuthCard } from './AuthCard'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const uid = params.get('uid')
  const token = params.get('token')

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setErrors({ password: 'Use at least 8 characters.' })
    if (password !== confirm) return setErrors({ confirm: 'The passwords do not match.' })
    setLoading(true)
    try {
      const data = await api.auth.confirmPasswordReset({ uid, token, password })
      toast(data.detail, { type: 'success', title: 'Password changed' })
      navigate('/login', { replace: true })
    } catch (err) {
      setErrors(err.fields?.password ? { password: err.fields.password[0] } : { form: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!uid || !token) {
    return (
      <AuthCard title="Link incomplete" subtitle="This reset link is missing information. Request a new one.">
        <Button as={Link} to="/forgot-password" className="w-full" size="lg">Request a new link</Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="You will be signed out on your other devices."
      footer={<Link to="/login" className="inline-flex items-center gap-1.5 rounded font-semibold text-brand-ink hover:underline"><ArrowLeft className="size-4" /> Back to sign in</Link>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="New password" icon={Lock} type="password" autoComplete="new-password" value={password} onChange={(e) => (setPassword(e.target.value), setErrors({}))} error={errors.password} />
        <Input label="Confirm new password" icon={Lock} type="password" autoComplete="new-password" value={confirm} onChange={(e) => (setConfirm(e.target.value), setErrors({}))} error={errors.confirm} />
        {errors.form && (
          <p className="rounded-xl border border-risk-high-line bg-risk-high-bg px-3.5 py-2.5 text-sm font-medium text-risk-high-fg" role="alert">
            {errors.form} <Link to="/forgot-password" className="underline">Request a new link</Link>
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" icon={KeyRound} loading={loading}>Save new password</Button>
      </form>
    </AuthCard>
  )
}
