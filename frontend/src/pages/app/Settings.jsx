import { useState } from 'react'
import { Save, LogOut, Database, ShieldCheck, KeyRound } from 'lucide-react'
import { ThemePicker } from '@/components/ui/ThemeToggle'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input, Toggle } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { USE_MOCK } from '@/lib/api'
import { resetMockDb } from '@/lib/mock'
import { formatDate, initials } from '@/lib/format'

function PasswordForm() {
  const { changePassword } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => (setForm((f) => ({ ...f, [k]: e.target.value })), setErrors({}))

  const submit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) return setErrors({ confirm: 'The new passwords do not match.' })
    setSaving(true)
    try {
      await changePassword({ current_password: form.current_password, new_password: form.new_password })
      setForm({ current_password: '', new_password: '', confirm: '' })
      toast('Password changed. Your other devices have been signed out.', { type: 'success' })
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, v[0]])))
      if (!Object.keys(err.fields).length) toast(err.message, { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Current password" type="password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} error={errors.current_password} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="New password" type="password" autoComplete="new-password" value={form.new_password} onChange={set('new_password')} error={errors.new_password} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
      </div>
      <Button type="submit" variant="secondary" icon={KeyRound} loading={saving} disabled={!form.current_password || !form.new_password}>Change password</Button>
    </form>
  )
}

function Section({ title, description, children }) {
  return (
    <section className="card grid gap-6 p-5 sm:p-6 lg:grid-cols-[260px_1fr]">
      <div>
        <h2 className="font-bold text-fg">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [profile, setProfile] = useState({ full_name: user.full_name, phone: user.phone ?? '' })
  const [saving, setSaving] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUser(profile)
      toast('Your profile was updated.', { type: 'success' })
    } catch (err) {
      toast(err.message, { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const setPref = async (key, value) => {
    try {
      await updateUser({ preferences: { [key]: value } })
    } catch (err) {
      toast(err.message, { type: 'error' })
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Your profile, privacy and appearance." />
      <div className="space-y-6">
        <Section title="Profile" description="Your name and phone number.">
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">{initials(profile.full_name)}</span>
              <div>
                <p className="font-semibold">{user.email}</p>
                <p className="text-sm text-slate-500">Member since {formatDate(user.date_joined)}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
              <Input label="Phone number" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="07XX XXX XXX" />
            </div>
            <Button type="submit" icon={Save} loading={saving}>Save changes</Button>
          </form>
        </Section>

        <Section title="Appearance" description="Choose light or dark, or follow your device setting.">
          <ThemePicker />
        </Section>

        <Section title="Password" description="Changing it signs you out on your other devices.">
          <PasswordForm />
        </Section>

        <Section title="Privacy" description="Raw message text is not stored unless you turn it on.">
          <div className="space-y-5">
            <Toggle
              checked={!!user.preferences?.save_scan_text}
              onChange={(v) => setPref('save_scan_text', v)}
              label="Save the text I check"
              description="Lets you see the original message in History. Off by default. Never paste PINs or passwords."
            />
            <div className="border-t border-line" />
            <Toggle
              checked={!!user.preferences?.weekly_summary}
              onChange={(v) => setPref('weekly_summary', v)}
              label="Weekly safety summary"
              description="A short weekly email with your checks, your Scam Sense level and the scams most checked on TrustShield."
            />
            <div className="flex items-start gap-3 rounded-xl bg-canvas p-4 text-sm text-slate-600">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-ink" />
              TrustShield 254 never asks for camera, contacts, location or SMS inbox access, and never asks for your M-PESA PIN, password or OTP.
            </div>
          </div>
        </Section>

        {USE_MOCK && (
          <Section title="Demo data" description="You are using the in-browser mock API.">
            <Button variant="secondary" icon={Database} onClick={() => (resetMockDb(), toast('Demo data reset. Sign in again with the demo account.', { type: 'success' }), logout().then(() => navigate('/login')))}>
              Reset demo data
            </Button>
          </Section>
        )}

        <Section title="Session" description="Sign out of TrustShield 254 on this device.">
          <Button variant="secondary" icon={LogOut} onClick={async () => (await logout(), navigate('/login'))}>Sign out</Button>
        </Section>
      </div>
    </>
  )
}
