import { cx } from '@/lib/format'

/**
 * TrustShield 254 mark: a shield carrying the almond band of the Maasai shield
 * on the Kenyan flag, with a verification check. On dark surfaces the body uses
 * Deep Blue so the silhouette stays visible against Navy.
 */
export function LogoMark({ className = 'size-9', tone = 'light', title }) {
  const body = tone === 'dark' ? '#123a54' : '#10243a'
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path
        d="M32 4.5 51.5 11v18.2c0 14-8.3 24.3-19.5 30.3C20.8 53.5 12.5 43.2 12.5 29.2V11L32 4.5Z"
        fill={body}
        stroke="#2868d7"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path d="M32 13.5c5.6 5 8.3 11 8.3 17.6S37.6 43.7 32 48.7c-5.6-5-8.3-11-8.3-17.6S26.4 18.5 32 13.5Z" fill="#2868d7" />
      <path d="M23.8 31.6 29.6 37.4 41 25.2" fill="none" stroke={body} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23.8 31.6 29.6 37.4 41 25.2" fill="none" stroke="#69dfbd" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ variant = 'light', subtitle = 'Verify before you pay.', className, size = 'md' }) {
  const onDark = variant === 'dark'
  const sizes = { sm: ['size-8', 'text-[18px]'], md: ['size-10', 'text-[21px]'], lg: ['size-14', 'text-[28px]'] }
  const [markSize, textSize] = sizes[size]
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <LogoMark tone={onDark ? 'dark' : 'light'} className={cx(markSize, 'shrink-0')} />
      <div className="leading-none">
        <p className={cx(textSize, 'font-extrabold tracking-tight', onDark ? 'text-white' : 'text-fg')}>
          TrustShield<span className={onDark ? 'text-mint-300' : 'text-brand-ink'}> 254</span>
        </p>
        {subtitle && <p className={cx('mt-1 text-[12px] font-medium', onDark ? 'text-mist-400' : 'text-slate-500')}>{subtitle}</p>}
      </div>
    </div>
  )
}
