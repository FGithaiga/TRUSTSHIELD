const dateFmt = new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-KE', { hour: '2-digit', minute: '2-digit' })
const shortDay = new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short' })

export const formatDate = (iso) => dateFmt.format(new Date(iso))
export const formatTime = (iso) => timeFmt.format(new Date(iso))
export const formatDateTime = (iso) => `${formatDate(iso)}, ${formatTime(iso)}`
export const formatShortDay = (iso) => shortDay.format(new Date(iso))

export function timeAgo(iso) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`
  return formatDate(iso)
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U'

export const cx = (...parts) => parts.flat().filter(Boolean).join(' ')
