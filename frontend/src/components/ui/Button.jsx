import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cx } from '@/lib/format'

const VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-[0_1px_2px_rgb(16_36_58/0.2)] hover:bg-brand-700 active:bg-brand-700 focus-visible:shadow-glow',
  secondary: 'bg-surface text-fg border border-line-strong hover:border-slate-400 hover:bg-slate-50 focus-visible:shadow-glow',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-fg focus-visible:shadow-glow',
  danger: 'bg-risk-high text-white hover:bg-risk-high-hover focus-visible:shadow-glow-danger',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 focus-visible:shadow-glow',
  // Always white: used on navy cards in both themes.
  light: 'bg-white text-ink-900 hover:bg-white/90 focus-visible:shadow-glow',
  outlineDark: 'border border-white/25 text-white hover:border-white/50 hover:bg-white/[0.06] focus-visible:shadow-glow',
}
const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-[15px] gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
  icon: 'size-10 rounded-xl',
}

export const Button = forwardRef(function Button(
  { as: Comp = 'button', variant = 'primary', size = 'md', loading = false, icon: Icon, iconRight: IconRight, className, children, disabled, ...props },
  ref,
) {
  return (
    <Comp
      ref={ref}
      className={cx(
        'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-[background-color,border-color,box-shadow,transform,color] duration-150 select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-[18px]" />}
      {children}
      {IconRight && !loading && <IconRight className="size-[18px]" />}
    </Comp>
  )
})
