import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cx } from '@/lib/format'

export function FieldShell({ label, hint, error, htmlFor, children, className, aside }) {
  return (
    <div className={className}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between">
          {label && <label htmlFor={htmlFor} className="label">{label}</label>}
          {aside}
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[13px] font-medium text-risk-high-fg">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef(function Input({ label, hint, error, icon: Icon, className, type = 'text', aside, trailing, ...props }, ref) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id} className={className} aside={aside}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-slate-400" />}
        <input
          ref={ref}
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={!!error}
          className={cx('field h-12', Icon && 'pl-11', (isPassword || trailing) && 'pr-11', error && 'border-risk-high focus:shadow-glow-danger')}
          {...props}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-fg" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
        {trailing && <div className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</div>}
      </div>
    </FieldShell>
  )
})

export const Textarea = forwardRef(function Textarea({ label, hint, error, className, maxLength, value, ...props }, ref) {
  const id = useId()
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      htmlFor={id}
      className={className}
      aside={maxLength ? <span className="tabular text-xs text-slate-400">{(value ?? '').length.toLocaleString()} / {maxLength.toLocaleString()}</span> : null}
    >
      <textarea ref={ref} id={id} value={value} maxLength={maxLength} aria-invalid={!!error} className={cx('field min-h-36 resize-y leading-relaxed', error && 'border-risk-high focus:shadow-glow-danger')} {...props} />
    </FieldShell>
  )
})

export const Select = forwardRef(function Select({ label, hint, error, className, options, ...props }, ref) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id} className={className}>
      <select ref={ref} id={id} className={cx('field h-12 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27none%27%20stroke%3D%27%2364748b%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m4%206%204%204%204-4%27/%3E%3C/svg%3E")] bg-[position:right_14px_center] bg-no-repeat pr-10', error && 'border-risk-high')} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldShell>
  )
})

export function Checkbox({ label, description, checked, onChange, className }) {
  return (
    <label className={cx('group flex cursor-pointer items-start gap-3', className)}>
      <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer size-5 cursor-pointer appearance-none rounded-md border border-line-strong bg-surface transition checked:border-brand-600 checked:bg-brand-600 focus-visible:shadow-glow group-hover:border-slate-400" />
        <svg viewBox="0 0 16 16" className="pointer-events-none absolute size-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 8.5 3 3 6-7" /></svg>
      </span>
      <span className="text-sm">
        <span className="font-medium text-fg">{label}</span>
        {description && <span className="mt-0.5 block text-slate-500">{description}</span>}
      </span>
    </label>
  )
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="text-sm">
        <p className="font-semibold text-fg">{label}</p>
        {description && <p className="mt-0.5 text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:shadow-glow', checked ? 'bg-brand-600' : 'bg-slate-300')}
      >
        <span className={cx('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200', checked && 'translate-x-5')} />
      </button>
    </div>
  )
}
