import { useEffect, useRef, useState } from 'react'
import { cx } from '@/lib/format'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animates a number from its previous value to the new one. */
export function CountUp({ value, duration = 900, format = (n) => n.toLocaleString() }) {
  const [shown, setShown] = useState(reduced() ? value : 0)
  const from = useRef(0)

  useEffect(() => {
    if (reduced()) return setShown(value)
    const start = performance.now()
    const begin = from.current
    let frame
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(begin + (value - begin) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
      else from.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <span className="tabular">{format(shown)}</span>
}

/** Fades content up when it scrolls into view. */
export function Reveal({ as: Tag = 'div', delay = 0, className, children, ...props }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(reduced)

  useEffect(() => {
    if (visible || !ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [visible])

  return (
    <Tag ref={ref} className={cx('reveal', visible && 'is-visible', className)} style={{ transitionDelay: `${delay}ms` }} {...props}>
      {children}
    </Tag>
  )
}

/** Reveals every `.reveal` / `.reveal-stagger` element inside the page as it scrolls into view. */
export function useRevealOnScroll(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.is-visible), .reveal-stagger:not(.is-visible)')
    if (reduced()) return els.forEach((el) => el.classList.add('is-visible'))
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-visible'), io.unobserve(e.target))),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
