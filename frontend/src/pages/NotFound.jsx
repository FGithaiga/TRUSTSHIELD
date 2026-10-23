import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="line-grid grid min-h-screen place-items-center bg-canvas px-5">
      <div className="animate-fade-up text-center">
        <LogoMark className="mx-auto size-16" />
        <p className="mt-6 font-mono text-sm font-semibold text-brand-ink">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">This page does not exist</h1>
        <p className="mt-2 text-slate-600">If someone sent you this link, treat it with caution.</p>
        <Button as={Link} to="/" className="mt-6" icon={ArrowLeft}>Back to TrustShield 254</Button>
      </div>
    </div>
  )
}
