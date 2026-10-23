/* Hand-built SVG artwork. Solid fills only, no gradients. */

export function KenyaFlag({ className = 'h-4 w-6' }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6" fill="#000" />
      <rect y="7" width="30" height="6" fill="#b00" />
      <rect y="14" width="30" height="6" fill="#060" />
      <ellipse cx="15" cy="10" rx="3.2" ry="6.2" fill="#b00" stroke="#000" strokeWidth="0.6" />
      <path d="M15 4.2v11.6" stroke="#fff" strokeWidth="0.8" />
    </svg>
  )
}

export function GoogleMark({ className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  )
}

export function MicrosoftMark({ className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
    </svg>
  )
}

/** Stylized Nairobi skyline silhouette (KICC tower and surrounding blocks). */
export function Skyline({ className }) {
  return (
    <svg viewBox="0 0 800 220" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <g fill="#123a54">
        <rect x="0" y="150" width="60" height="70" />
        <rect x="55" y="120" width="44" height="100" />
        <rect x="104" y="140" width="38" height="80" />
        <rect x="150" y="96" width="52" height="124" />
        <rect x="210" y="130" width="40" height="90" />
        <rect x="258" y="110" width="30" height="110" />
        {/* KICC */}
        <rect x="318" y="58" width="34" height="162" />
        <rect x="312" y="52" width="46" height="8" rx="2" />
        <path d="M313 52c4-14 40-14 44 0Z" />
        <rect x="333" y="22" width="4" height="22" />
        <rect x="300" y="190" width="70" height="30" />
        <rect x="378" y="104" width="48" height="116" />
        <rect x="432" y="136" width="36" height="84" />
        <rect x="476" y="80" width="40" height="140" />
        <rect x="490" y="66" width="12" height="16" />
        <rect x="524" y="124" width="54" height="96" />
        <rect x="586" y="100" width="34" height="120" />
        <rect x="628" y="140" width="46" height="80" />
        <rect x="680" y="116" width="40" height="104" />
        <rect x="728" y="148" width="72" height="72" />
      </g>
      <g fill="#1b4a68">
        {[[160, 110], [160, 130], [180, 110], [180, 150], [390, 120], [405, 140], [390, 170], [486, 100], [486, 130], [500, 160], [536, 140], [556, 160], [598, 120], [598, 150], [690, 130], [705, 160], [66, 136], [80, 160]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="6" height="8" />
        ))}
      </g>
    </svg>
  )
}
