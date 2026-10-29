import {
  LayoutDashboard, Smartphone, Link2, Briefcase, ListChecks, LifeBuoy, History, Radar, Settings, GraduationCap,
} from 'lucide-react'

export const NAV = [
  { section: 'Overview', items: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true, keywords: 'home summary charts' }] },
  {
    section: 'Checkers',
    items: [
      { to: '/app/mpesa', label: 'SMS Checker', icon: Smartphone, keywords: 'sms message reversal pin' },
      { to: '/app/links', label: 'Link Checker', icon: Link2, keywords: 'url website domain phishing' },
      { to: '/app/offers', label: 'Job Checker', icon: Briefcase, keywords: 'job advert vacancy recruitment' },
    ],
  },
  {
    section: 'Protect',
    items: [
      { to: '/app/before-you-pay', label: 'Before You Pay', icon: ListChecks, keywords: 'checklist payment till paybill' },
      { to: '/app/incidents', label: 'Incident Assistant', icon: LifeBuoy, keywords: 'scammed report help police dci' },
      { to: '/app/trainer', label: 'Scam Sense Trainer', icon: GraduationCap, keywords: 'quiz practice game learn' },
    ],
  },
  {
    section: 'Activity',
    items: [
      { to: '/app/history', label: 'History', icon: History, keywords: 'past checks results' },
      { to: '/app/threat-feed', label: 'Threat Feed', icon: Radar, keywords: 'community reports trends' },
      { to: '/app/settings', label: 'Settings', icon: Settings, keywords: 'profile privacy theme account' },
    ],
  },
]

/** Section and page for the current path, used by the breadcrumb. */
export function locate(pathname) {
  for (const group of NAV) {
    for (const item of group.items) {
      if (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + '/')) {
        return { section: group.section, item, detail: pathname !== item.to }
      }
    }
  }
  return null
}
