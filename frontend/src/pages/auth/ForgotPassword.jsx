import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, MailCheck, Send } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { AuthCard } from './AuthCard'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter the email address you signed up with.')
    setLoading(true)
    setError('')
    try {
      await api.auth.requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title={sent ? 'Check your email' : 'Reset your password'}
      subtitle={sent ? 'If that email has an account, a link is on its way.' : "We'll email you a reset link."}
      footer={<Link to="/login" className="inline-flex items-center gap-1.5 rounded font-semibold text-brand-ink hover:underline focus-visible:shadow-glow"><ArrowLeft className="size-4" /> Back to sign in</Link>}
    >
      {sent ? (
        <div className="animate-scale-in rounded-2xl border border-line bg-canvas p-5 text-center">
          <MailCheck className="mx-auto size-10 text-risk-clear-fg" />
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The link works once and expires after a few days. Didn&rsquo;t get it? Check your spam folder or{' '}
            <button onClick={() => setSent(false)} className="font-semibold text-brand-ink hover:underline">try again</button>.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => (setEmail(e.target.value), setError(''))} error={error} />
          <Button type="submit" size="lg" className="w-full" icon={Send} loading={loading}>Send reset link</Button>
        </form>
      )}
    </AuthCard>
  )
}
