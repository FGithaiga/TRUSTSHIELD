import { UsersRound, Phone, Globe } from 'lucide-react'

/** Shown when a number or domain in this check was flagged by other people. */
export function CommunityMatches({ matches }) {
  return (
    <div className="dot-grid overflow-hidden rounded-2xl bg-ink-900 text-white">
      <div className="flex items-center gap-3 px-5 pt-5">
        <span className="grid size-10 place-items-center rounded-xl bg-ink-800">
          <UsersRound className="size-5 text-mint-300" />
        </span>
        <div>
          <h3 className="font-bold">Seen before in the community</h3>
          <p className="text-[13px] text-mist-300">Other people flagged what appears in this check.</p>
        </div>
      </div>
      <ul className="space-y-2 p-5">
        {matches.map((m) => {
          const Icon = m.kind === 'phone' ? Phone : Globe
          return (
            <li key={`${m.kind}-${m.masked}`} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="flex items-center gap-2 font-mono text-sm font-semibold text-mint-300">
                <Icon className="size-4" /> {m.masked}
              </p>
              <p className="mt-1 text-[13px] text-mist-300">
                {[
                  m.users > 0 && `Flagged in ${m.users} other ${m.users === 1 ? "person's" : "people's"} checks`,
                  m.reports > 0 && `${m.reports} community report${m.reports === 1 ? '' : 's'}`,
                ].filter(Boolean).join(' and ')}{' '}
                in the last 90 days.
              </p>
            </li>
          )
        })}
      </ul>
      <p className="border-t border-white/10 px-5 py-3 text-xs leading-relaxed text-mist-400">
        Numbers and links are remembered only as private one-way fingerprints, never as text.
      </p>
    </div>
  )
}
