/**
 * In-browser mock of the TrustShield 254 Django API.
 *
 * Development fixture only: it lets the frontend run without the backend and
 * documents the response contract. Its rule checks are a simplified preview
 * of the server-side rule engine, and it never calls the real ML models, so
 * every result it returns carries model_version "mock-dev".
 */

const DB_KEY = 'ts254.mockdb.v2'
const LATENCY = [350, 900]

const OFFICIAL_DOMAINS = [
  'safaricom.co.ke', 'safaricom.com', 'mpesa.co.ke', 'airtel.co.ke', 'kcbgroup.com', 'equitybank.co.ke',
  'ncbagroup.com', 'co-opbank.co.ke', 'kra.go.ke', 'ecitizen.go.ke', 'go.ke', 'google.com', 'microsoft.com',
]
const BRANDS = ['safaricom', 'mpesa', 'm-pesa', 'airtel', 'kcb', 'equity', 'ncba', 'coop', 'kra', 'ecitizen', 'helb', 'nhif', 'sha']
const RISKY_TLDS = ['xyz', 'top', 'click', 'buzz', 'icu', 'live', 'online', 'site', 'loan', 'win', 'info', 'rest', 'cfd']
const SHORTENERS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 't.co', 'is.gd', 'rb.gy', 'shorturl.at', 'tiny.cc']

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|ke|net|org|xyz|top|click|info|online|site|live|ly)(?:\/[^\s]*)?)/gi
const PHONE_RE = /(?:\+?254|0)\s?(?:7|1)\d{2}\s?\d{3}\s?\d{3}/g

const wait = () => new Promise((r) => setTimeout(r, LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0])))
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))
const now = () => new Date().toISOString()

/* ------------------------------------------------------------------ */
/* Storage                                                            */
/* ------------------------------------------------------------------ */

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through to a fresh seed */
  }
  const db = seed()
  saveDb(db)
  return db
}
const saveDb = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db))

function seed() {
  const demoUser = {
    id: 1,
    full_name: 'Amani Otieno',
    email: 'demo@trustshield254.ke',
    phone: '0700000000',
    password: 'Demo@2540',
    date_joined: new Date(Date.now() - 40 * 864e5).toISOString(),
    preferences: { save_scan_text: false, weekly_summary: true },
  }

  // Deterministic pseudo-random history so the dashboard has shape.
  let s = 7
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const categories = {
    mpesa: ['Fake reversal request', 'PIN or OTP request', 'Prize or promotion scam', 'Suspicious payment instruction'],
    url: ['Brand impersonation link', 'Suspicious link structure', 'Shortened link'],
    offer: ['Advance-fee job offer', 'Unrealistic investment return', 'Prepayment shopping scam'],
  }
  const previews = {
    mpesa: ['SMS message, 162 characters', 'SMS message, 118 characters', 'SMS message, 204 characters'],
    url: ['safaricom-bonus-ke.xyz', 'bit.ly', 'mpesa-verify.online', 'www.safaricom.co.ke', '197.0.0.12'],
    offer: ['Job offer, 241 characters', 'Investment offer, 133 characters', 'Shopping offer, 98 characters'],
  }
  const scans = []
  for (let d = 29; d >= 0; d--) {
    const count = Math.floor(rand() * 4) + (d < 7 ? 2 : 0)
    for (let i = 0; i < count; i++) {
      const type = rand() < 0.55 ? 'mpesa' : rand() < 0.6 ? 'url' : 'offer'
      const r = rand()
      const risk_level = r < 0.38 ? 'high' : r < 0.66 ? 'caution' : 'clear'
      const created = new Date(Date.now() - d * 864e5 - Math.floor(rand() * 10 * 36e5))
      scans.push({
        id: uid(),
        user_id: 1,
        scan_type: type,
        risk_level,
        risk_score: risk_level === 'high' ? 70 + Math.floor(rand() * 25) : risk_level === 'caution' ? 30 + Math.floor(rand() * 25) : 5 + Math.floor(rand() * 15),
        scam_category: risk_level === 'clear' ? 'No category' : categories[type][Math.floor(rand() * categories[type].length)],
        preview: previews[type][Math.floor(rand() * previews[type].length)],
        created_at: created.toISOString(),
        seeded: true,
      })
    }
  }

  const reports = [
    ['mpesa', 'Fake reversal request', 'Caller claims to have sent money by mistake and pressures the recipient to send it back to a different number.', 'Nairobi', ['Reversal request', 'Urgency', 'Different callback number']],
    ['url', 'Brand impersonation link', 'SMS with a look-alike Safaricom rewards domain asking users to log in to claim bonus points.', 'Kisumu', ['Look-alike domain', 'Reward claim']],
    ['offer', 'Advance-fee job offer', 'Recruitment ad for hotel jobs abroad requiring a medical and visa processing fee before any interview.', 'Mombasa', ['Upfront fee', 'No interview']],
    ['mpesa', 'PIN or OTP request', 'Message pretending to be customer care asks for the M-PESA PIN to prevent account suspension.', 'Nakuru', ['PIN request', 'Account suspension threat']],
    ['offer', 'Prepayment shopping scam', 'Social media shop selling electronics far below market price, payment before delivery only.', 'Eldoret', ['Too-low price', 'Prepayment only']],
    ['offer', 'Unrealistic investment return', 'Group chat promoting a forex scheme promising to double deposits within a week.', 'Nyeri', ['Guaranteed returns', 'Deadline pressure']],
    ['url', 'Shortened link', 'Shortened link in a loan approval SMS that redirects to a form requesting ID and PIN.', 'Machakos', ['Shortened link', 'Credential request']],
    ['mpesa', 'Prize or promotion scam', 'Message claims the recipient won a promotion and must pay a clearance fee to a till number.', 'Thika', ['Prize claim', 'Fee to claim']],
  ].map(([channel, category, summary, region, indicators], i) => ({
    id: i + 1,
    channel,
    category,
    summary,
    region,
    indicators,
    status: 'synthetic',
    reported_at: new Date(Date.now() - (i * 19 + 3) * 36e5).toISOString(),
  }))

  return { users: [demoUser], tokens: {}, scans, incidents: [], reports, nextUserId: 2 }
}

/* ------------------------------------------------------------------ */
/* Rule engine (preview of the backend implementation)                */
/* ------------------------------------------------------------------ */

const WEIGHT = { high: 34, medium: 17, low: 7 }

function matchAll(text, re) {
  const out = []
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
  let m
  while ((m = g.exec(text)) && out.length < 3) out.push(m[0].trim())
  return [...new Set(out)]
}

function rule(findings, text, { code, re, title, detail, severity, source = 'rule' }) {
  const evidence = matchAll(text, re)
  if (evidence.length) findings.push({ code, title, detail, severity, evidence, source })
}

function hostOf(raw) {
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `http://${raw}`)
    return { url: u, host: u.hostname.toLowerCase().replace(/\.$/, '') }
  } catch {
    return null
  }
}

function isOfficial(host) {
  return OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
}

function analyzeUrl(raw) {
  const findings = []
  const parsed = hostOf(raw.trim())
  if (!parsed || !parsed.host.includes('.')) {
    return { error: 'Enter a valid link, for example https://example.co.ke/page' }
  }
  const { url, host } = parsed
  const parts = host.split('.')
  const tld = parts.at(-1)
  const registered = host.endsWith('.co.ke') || host.endsWith('.go.ke') || host.endsWith('.or.ke') ? parts.slice(-3).join('.') : parts.slice(-2).join('.')
  const official = isOfficial(host)
  const brand = BRANDS.find((b) => host.replace(/-/g, '').includes(b.replace('-', '')))
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host)

  if (brand && !official) {
    findings.push({
      code: 'brand_impersonation', severity: 'high', source: 'url',
      title: `Uses the name "${brand}" on an unofficial domain`,
      detail: `The domain ${registered} contains a well-known brand name but is not one of that organization's official domains.`,
      evidence: [host],
    })
  }
  if (isIp) findings.push({ code: 'ip_host', severity: 'high', source: 'url', title: 'Uses a raw IP address instead of a domain', detail: 'Legitimate services rarely ask you to open a bare IP address.', evidence: [host] })
  if (SHORTENERS.includes(host)) findings.push({ code: 'shortener', severity: 'medium', source: 'url', title: 'Shortened link hides the real destination', detail: 'You cannot see where this link leads until you open it.', evidence: [host] })
  if (url.protocol === 'http:') findings.push({ code: 'no_https', severity: 'low', source: 'url', title: 'Not using HTTPS', detail: 'The connection would not be encrypted. Most legitimate login and payment pages use HTTPS.', evidence: [`${url.protocol}//`] })
  if (RISKY_TLDS.includes(tld)) findings.push({ code: 'risky_tld', severity: 'medium', source: 'url', title: `Domain ending ".${tld}" is common in scam campaigns`, detail: 'Low-cost domain endings are frequently used for short-lived phishing sites.', evidence: [`.${tld}`] })
  if (parts.length > 4) findings.push({ code: 'many_subdomains', severity: 'medium', source: 'url', title: 'Unusual subdomain structure', detail: 'Several stacked subdomains can be used to make a link look official at a glance.', evidence: [host] })
  if (host.startsWith('xn--') || host.includes('.xn--')) findings.push({ code: 'punycode', severity: 'high', source: 'url', title: 'Contains look-alike international characters', detail: 'Punycode domains can imitate familiar names using similar-looking letters.', evidence: [host] })
  if (raw.includes('@')) findings.push({ code: 'at_symbol', severity: 'high', source: 'url', title: 'Contains an "@" symbol', detail: 'Text before an "@" in a link is ignored by the browser and is a known disguise technique.', evidence: ['@'] })
  rule(findings, url.pathname + url.search, { code: 'lure_words', re: /(claim|verify|login|update|reward|bonus|free|suspend|unlock|win)/i, title: 'Link path uses lure words', detail: 'Words like "claim", "verify" or "bonus" in a link are common in phishing campaigns.', severity: 'low', source: 'url' })
  if (raw.length > 90) findings.push({ code: 'long_url', severity: 'low', source: 'url', title: 'Very long link', detail: 'Long links can hide the real domain among extra text.', evidence: [`${raw.length} characters`] })

  return {
    findings,
    url_details: {
      hostname: host,
      registered_domain: registered,
      scheme: url.protocol.replace(':', ''),
      is_https: url.protocol === 'https:',
      is_official_domain: official,
      impersonated_brand: brand && !official ? brand : null,
      subdomain_count: Math.max(parts.length - (registered.split('.').length), 0),
      registered_on: null,
    },
    model_result: {
      model: 'phishing_url',
      label: findings.some((f) => f.severity === 'high') ? 'Phishing URL' : 'Legitimate URL',
      validated_for_real_world_use: false,
      note: 'Mock result. The real phishing model runs on the backend.',
    },
  }
}

function analyzeMpesa(text) {
  const findings = []
  rule(findings, text, { code: 'pin_request', re: /\b(pin|otp|one[- ]time (?:password|code)|password|secret code)\b/i, severity: 'high', title: 'Asks for your PIN, OTP or password', detail: 'Safaricom and banks never ask for your mobile money PIN or one-time code by SMS or phone call.' })
  rule(findings, text, { code: 'reversal_request', re: /(revers\w*|by mistake|wrongly sent|kimakosa|rudisha|send (?:it )?back)/i, severity: 'high', title: 'Asks you to reverse or return a payment', detail: 'Genuine wrong transfers are reversed by the sender through Safaricom. Check your actual M-PESA balance before sending anything back.' })
  rule(findings, text, { code: 'fee_to_claim', re: /((?:processing|clearance|registration|activation) fee|pay (?:a )?fee|to claim)/i, severity: 'high', title: 'Requests a fee to release money or a prize', detail: 'Paying to receive a prize or refund is a common advance-fee pattern.' })
  rule(findings, text, { code: 'prize_claim', re: /(you have won|umeshinda|winner|congratulations|zawadi|promotion|bonus points?)/i, severity: 'medium', title: 'Claims you have won a prize or bonus', detail: 'Unexpected prize messages are frequently used to start a scam.' })
  rule(findings, text, { code: 'urgency', re: /(urgent\w*|immediately|within \d+ (?:minutes?|hours?)|haraka|sasa hivi|tonight|suspended|blocked)/i, severity: 'medium', title: 'Creates urgency or threatens your account', detail: 'Pressure to act quickly is used to stop you from checking the facts.' })
  rule(findings, text, { code: 'payment_instruction', re: /((?:send|tuma|pay|lipa)\b[^.]{0,40}?(?:ksh|kes|till|paybill|\d{3,}))/i, severity: 'medium', title: 'Contains a payment instruction', detail: 'Verify the recipient independently before sending money.' })
  rule(findings, text, { code: 'phone_number', re: PHONE_RE, severity: 'low', title: 'Includes a phone number to contact or pay', detail: 'Scammers often ask you to call or pay a personal number instead of an official channel.' })
  rule(findings, text, { code: 'confirmation_claim', re: /\b(confirmed\.|you have received)/i, severity: 'low', title: 'Looks like an M-PESA confirmation', detail: 'Message text cannot prove a payment arrived. Check your M-PESA balance or statement directly.' })

  const link = text.match(URL_RE)?.[0]
  let url_details = null
  if (link) {
    const sub = analyzeUrl(link)
    if (!sub.error) {
      url_details = sub.url_details
      findings.push({ code: 'contains_link', severity: sub.findings.some((f) => f.severity === 'high') ? 'high' : 'medium', source: 'url', title: 'Contains a link', detail: sub.url_details.impersonated_brand ? `The link uses "${sub.url_details.impersonated_brand}" on an unofficial domain.` : 'Do not open links in unexpected payment messages.', evidence: [link] })
    }
  }
  const strong = findings.filter((f) => f.severity !== 'low').length
  return {
    findings,
    url_details,
    model_result: { model: 'sms_spam', label: strong >= 1 ? 'SPAM' : 'HAM', validated_for_real_world_use: false, note: 'Mock result. The real SMS classifier runs on the backend.' },
  }
}

function analyzeOffer(text, offerType) {
  const findings = []
  rule(findings, text, { code: 'upfront_fee', re: /((?:registration|application|processing|training|medical|visa|activation) fee|pay\b[^.]{0,30}?(?:to secure|first|before|to reserve|to join)|pay full amount first)/i, severity: 'high', title: 'Asks for payment before you receive anything', detail: 'Legitimate employers do not charge to apply. Prepayment-only sellers leave you with no recourse.' })
  rule(findings, text, { code: 'unrealistic_return', re: /(double your money|guaranteed (?:returns?|profit|income)|\d{2,3}% (?:returns?|profit)|earn ksh ?[\d,]+ (?:per|a|every) (?:day|week))/i, severity: 'high', title: 'Promises unrealistic income or returns', detail: 'Guaranteed or very high returns are a hallmark of fraudulent schemes.' })
  rule(findings, text, { code: 'no_interview', re: /(no (?:experience|interview|qualifications?)(?: or \w+)? (?:needed|required)|no interview)/i, severity: 'medium', title: 'No interview or experience required', detail: 'Real employers assess candidates before hiring.' })
  rule(findings, text, { code: 'informal_contact', re: /(whatsapp only|telegram|dm only|inbox only|contact hr on whatsapp)/i, severity: 'medium', title: 'Contact only through informal chat apps', detail: 'Check for an official company website, email domain and physical address.' })
  rule(findings, text, { code: 'urgency', re: /(urgent\w*|limited (?:slots?|stock)|ends tonight|today only|pay now|hurry)/i, severity: 'medium', title: 'Pressure to decide quickly', detail: 'Deadlines and limited slots push you to skip verification.' })
  rule(findings, text, { code: 'too_cheap', re: /(brand new [^.]{0,30}for only ksh ?[\d,]+|\b(?:90|80|70)% off)/i, severity: 'medium', title: 'Price looks far below market value', detail: 'Compare with established retailers before paying.' })
  rule(findings, text, { code: 'work_from_home', re: /(work from home|online typing|data entry)/i, severity: 'low', title: 'Common remote-job scam wording', detail: 'Remote roles are often genuine, but this wording is frequent in fake job adverts.' })

  return {
    findings,
    url_details: null,
    model_result: offerType === 'job'
      ? { model: 'fake_job', label: findings.some((f) => f.severity === 'high') ? 'Fraudulent job posting' : 'Likely legitimate job posting', validated_for_real_world_use: false, note: 'Mock result. The real fake-job classifier runs on the backend.' }
      : null,
  }
}

const CATEGORY_BY_CODE = [
  ['pin_request', 'PIN or OTP request'],
  ['reversal_request', 'Fake reversal request'],
  ['fee_to_claim', 'Prize or promotion scam'],
  ['prize_claim', 'Prize or promotion scam'],
  ['brand_impersonation', 'Brand impersonation link'],
  ['ip_host', 'Suspicious link structure'],
  ['punycode', 'Suspicious link structure'],
  ['shortener', 'Shortened link'],
  ['unrealistic_return', 'Unrealistic investment return'],
  ['upfront_fee', 'Advance-fee offer'],
  ['too_cheap', 'Prepayment shopping scam'],
  ['payment_instruction', 'Suspicious payment instruction'],
]

const ACTIONS = {
  high: [
    'Do not send money, share your PIN or open any link in this message.',
    'Check your M-PESA balance directly on your phone. Do not rely on the message text.',
    'Forward suspicious SMS messages to 333 to report them to Safaricom.',
    'If you have already paid or shared details, use the Incident Assistant now.',
  ],
  caution: [
    'Pause before acting. Contact the person or company through a channel you already trust.',
    'Confirm any payment by checking your own M-PESA statement.',
    'Do not share your PIN, OTP or ID details in response to this message.',
  ],
  clear: [
    'No strong warning signs were found, but the sender has not been verified.',
    'Use the Before You Pay checklist for any payment involved.',
  ],
}

const LIMITATIONS = [
  'This is a risk assessment, not proof of fraud or safety.',
  'Message text alone cannot confirm whether Safaricom sent a message or whether a transaction completed.',
  'Model predictions are experimental and have not been validated for real-world use.',
]

function assemble(scanType, content, offerType, analysis) {
  const { findings } = analysis
  const order = { high: 0, medium: 1, low: 2 }
  findings.sort((a, b) => order[a.severity] - order[b.severity])

  const raw = findings.reduce((s, f) => s + WEIGHT[f.severity], 0)
  const modelFlag = ['SPAM', 'Phishing URL', 'Fraudulent job posting'].includes(analysis.model_result?.label)
  const risk_score = Math.min(98, Math.max(3, raw + (modelFlag ? 8 : 0)))
  const highCount = findings.filter((f) => f.severity === 'high').length
  const risk_level = risk_score >= 55 || highCount >= 2 ? 'high' : risk_score >= 22 || highCount === 1 ? 'caution' : 'clear'

  const codes = findings.map((f) => f.code)
  const scam_category = risk_level === 'clear' ? 'No category' : (CATEGORY_BY_CODE.find(([c]) => codes.includes(c))?.[1] ?? 'General suspicious content')

  const top = findings.slice(0, 3).map((f) => f.title[0].toLowerCase() + f.title.slice(1))
  const explanation = risk_level === 'clear'
    ? 'The rule checks did not find strong warning signs. That does not confirm who sent this or that it is safe, so verify any payment through official channels.'
    : `This ${scanType === 'url' ? 'link' : scanType === 'offer' ? 'offer' : 'message'} shows ${findings.length} warning sign${findings.length === 1 ? '' : 's'}. The most important: ${top.join('; ')}. These patterns are common in scams, but they are indicators, not proof.`

  const summary = {
    high: 'Multiple strong warning signs found.',
    caution: 'Some warning signs found. Verify before acting.',
    clear: 'No obvious warning signs detected.',
  }[risk_level]

  return {
    id: uid(),
    scan_type: scanType,
    offer_type: scanType === 'offer' ? offerType : null,
    created_at: now(),
    risk_level,
    risk_score,
    risk_score_is_heuristic: true,
    scam_category,
    summary,
    findings,
    url_details: analysis.url_details,
    model_result: analysis.model_result,
    explanation,
    explanation_source: 'template',
    recommended_actions: ACTIONS[risk_level],
    limitations: LIMITATIONS,
    model_version: 'mock-dev',
    preview: previewFor(scanType, content, offerType, analysis.url_details),
  }
}

function previewFor(scanType, content, offerType, urlDetails) {
  if (scanType === 'url') return urlDetails?.hostname ?? 'Link'
  const label = scanType === 'mpesa' ? 'SMS message' : `${offerType ? offerType[0].toUpperCase() + offerType.slice(1) : 'Other'} offer`
  return `${label}, ${content.length} characters`
}

/* ------------------------------------------------------------------ */
/* Router                                                             */
/* ------------------------------------------------------------------ */

const ok = (data, status = 200) => ({ status, data })
const fail = (status, data) => ({ status, data })
const publicUser = ({ password: _password, ...u }) => u
const withoutOwner = ({ user_id: _owner, ...rest }) => rest
// List items carry only summary fields, matching the API's compact list serializer.
const listItem = ({ id, scan_type, offer_type = null, created_at, risk_level, risk_score, scam_category, preview }) => ({ id, scan_type, offer_type, created_at, risk_level, risk_score, scam_category, preview })

function currentUser(db, token) {
  const id = token && db.tokens[token]
  return id ? db.users.find((u) => u.id === id) : null
}

function summarize(scans, days) {
  const since = Date.now() - days * 864e5
  const inRange = scans.filter((s) => new Date(s.created_at).getTime() >= since)
  const byDay = []
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10)
    const day = inRange.filter((s) => s.created_at.slice(0, 10) === date)
    byDay.push({ date, high: day.filter((s) => s.risk_level === 'high').length, caution: day.filter((s) => s.risk_level === 'caution').length, clear: day.filter((s) => s.risk_level === 'clear').length })
  }
  const count = (key, val) => inRange.filter((s) => s[key] === val).length
  const cats = {}
  inRange.filter((s) => s.scam_category !== 'No category').forEach((s) => (cats[s.scam_category] = (cats[s.scam_category] || 0) + 1))
  return {
    days,
    totals: { scans: inRange.length, high: count('risk_level', 'high'), caution: count('risk_level', 'caution'), clear: count('risk_level', 'clear') },
    by_day: byDay,
    by_type: ['mpesa', 'url', 'offer'].map((t) => ({ scan_type: t, count: count('scan_type', t) })),
    top_categories: Object.entries(cats).map(([category, c]) => ({ category, count: c })).sort((a, b) => b.count - a.count).slice(0, 5),
    recent: [...scans].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6).map(listItem),
  }
}

const GUIDANCE = {
  resources: [
    { id: 'safaricom-333', name: 'Safaricom fraud SMS reporting', contact: 'Forward the SMS to 333', kind: 'Report', description: 'Report scam text messages to Safaricom at no cost.', url: 'https://www.safaricom.co.ke' },
    { id: 'safaricom-care', name: 'Safaricom Customer Care', contact: 'Call 100 (prepaid) or 200 (postpaid)', kind: 'Support', description: 'Ask about a transaction, reversal or SIM issue.', url: 'https://www.safaricom.co.ke' },
    { id: 'dci', name: 'Directorate of Criminal Investigations', contact: 'Toll-free 0800 722 203', kind: 'Report', description: 'Report fraud and cybercrime to the DCI.', url: 'https://www.dci.go.ke' },
    { id: 'kecirt', name: 'National KE-CIRT/CC', contact: 'Report online at ke-cirt.go.ke', kind: 'Report', description: 'National cybersecurity incident reporting.', url: 'https://www.ke-cirt.go.ke' },
    { id: 'police', name: 'Emergency police', contact: 'Call 999 or 112', kind: 'Emergency', description: 'For threats or any situation where you are in danger.', url: null },
  ],
  verified_on: '2026-10-23',
}

export async function mockRequest(method, path, body, token) {
  await wait()
  const db = loadDb()
  const [route, query = ''] = path.split('?')
  const params = Object.fromEntries(new URLSearchParams(query))
  const user = currentUser(db, token)
  const requireUser = () => (user ? null : fail(401, { detail: 'Authentication credentials were not provided.' }))

  // Public routes
  if (method === 'GET' && route === '/health/') return ok({ status: 'ok', mode: 'mock', models_loaded: false })

  if (method === 'POST' && route === '/auth/register/') {
    const errors = {}
    if (!body?.full_name?.trim()) errors.full_name = ['Enter your name.']
    if (!/^\S+@\S+\.\S+$/.test(body?.email ?? '')) errors.email = ['Enter a valid email address.']
    else if (db.users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) errors.email = ['An account with this email already exists.']
    if ((body?.password ?? '').length < 8) errors.password = ['Use at least 8 characters.']
    if (Object.keys(errors).length) return fail(400, errors)
    const newUser = { id: db.nextUserId++, full_name: body.full_name.trim(), email: body.email.trim(), phone: body.phone || '', password: body.password, date_joined: now(), preferences: { save_scan_text: false, weekly_summary: true } }
    db.users.push(newUser)
    const t = uid()
    db.tokens[t] = newUser.id
    saveDb(db)
    return ok({ token: t, user: publicUser(newUser) }, 201)
  }

  if (method === 'POST' && route === '/auth/login/') {
    const id = (body?.identifier ?? '').trim().toLowerCase()
    const found = db.users.find((u) => u.email.toLowerCase() === id || (u.phone && u.phone === id))
    if (!found || found.password !== body?.password) return fail(400, { non_field_errors: ['Incorrect email, phone number or password.'] })
    const t = uid()
    db.tokens[t] = found.id
    saveDb(db)
    return ok({ token: t, user: publicUser(found) })
  }

  if (method === 'GET' && route === '/guidance/') return ok(GUIDANCE)

  if (method === 'POST' && route === '/auth/password-reset/') return ok({ detail: 'If an account exists for that email, a reset link is on its way.' })
  if (method === 'POST' && route === '/auth/password-reset/confirm/') return fail(400, { detail: 'Password reset emails are not sent in demo mode.' })

  if (method === 'GET' && route === '/pulse/') {
    const week = db.scans.filter((x) => Date.now() - new Date(x.created_at).getTime() < 7 * 864e5)
    const prev = db.scans.filter((x) => { const age = Date.now() - new Date(x.created_at).getTime(); return age >= 7 * 864e5 && age < 14 * 864e5 })
    const tally = (list) => list.filter((x) => x.scam_category !== 'No category').reduce((m, x) => ((m[x.scam_category] = (m[x.scam_category] || 0) + 1), m), {})
    const now7 = tally(week), before = tally(prev)
    return ok({
      window_days: 7,
      enough_data: week.length >= 6,
      checks: week.length,
      high_share: week.length ? Math.round((week.filter((x) => x.risk_level === 'high').length / week.length) * 100) : 0,
      trending: Object.entries(now7).filter(([, c]) => c >= 3).map(([category, count]) => ({ category, count, previous: before[category] || 0 })).sort((a, b) => b.count - a.count).slice(0, 5),
      by_type: ['mpesa', 'url', 'offer'].map((t) => ({ scan_type: t, count: week.filter((x) => x.scan_type === t).length })),
      generated_at: now(),
    })
  }

  if (method === 'GET' && route === '/reports/') {
    let list = [...db.reports].sort((a, b) => b.reported_at.localeCompare(a.reported_at))
    if (params.channel) list = list.filter((r) => r.channel === params.channel)
    return ok({ count: list.length, results: list })
  }

  // Authenticated routes
  const denied = requireUser()
  if (denied) return denied

  if (method === 'POST' && route === '/auth/logout/') {
    delete db.tokens[token]
    saveDb(db)
    return ok(null, 204)
  }
  if (method === 'GET' && route === '/auth/me/') return ok(publicUser(user))
  if (method === 'POST' && route === '/auth/change-password/') {
    if (body?.current_password !== user.password) return fail(400, { current_password: ['Your current password is incorrect.'] })
    if ((body?.new_password ?? '').length < 8) return fail(400, { new_password: ['Use at least 8 characters.'] })
    user.password = body.new_password
    Object.keys(db.tokens).forEach((t) => db.tokens[t] === user.id && delete db.tokens[t])
    const t = uid()
    db.tokens[t] = user.id
    saveDb(db)
    return ok({ token: t, user: publicUser(user) })
  }
  if (method === 'PATCH' && route === '/auth/me/') {
    if (body.full_name !== undefined) user.full_name = body.full_name
    if (body.phone !== undefined) user.phone = body.phone
    if (body.preferences) user.preferences = { ...user.preferences, ...body.preferences }
    saveDb(db)
    return ok(publicUser(user))
  }

  if (method === 'POST' && route === '/scans/analyze/') {
    const content = (body?.content ?? '').trim()
    const type = body?.scan_type
    if (!['mpesa', 'url', 'offer'].includes(type)) return fail(400, { scan_type: ['Choose mpesa, url or offer.'] })
    if (!content) return fail(400, { content: [type === 'url' ? 'Enter a link to check.' : 'Paste the text you want to check.'] })
    if (content.length > 5000) return fail(400, { content: ['Keep the text under 5,000 characters.'] })

    const analysis = type === 'url' ? analyzeUrl(content) : type === 'mpesa' ? analyzeMpesa(content) : analyzeOffer(content, body.offer_type)
    if (analysis.error) return fail(400, { content: [analysis.error] })

    const result = assemble(type, content, body.offer_type, analysis)
    const stored = { ...result, user_id: user.id, content: user.preferences.save_scan_text ? content : null }
    db.scans.push(stored)
    saveDb(db)
    return ok(result, 201)
  }

  if (method === 'GET' && route === '/scans/') {
    let list = db.scans.filter((s) => s.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at))
    if (params.risk_level) list = list.filter((s) => s.risk_level === params.risk_level)
    if (params.scan_type) list = list.filter((s) => s.scan_type === params.scan_type)
    if (params.search) list = list.filter((s) => `${s.preview} ${s.scam_category}`.toLowerCase().includes(params.search.toLowerCase()))
    const page = Number(params.page || 1)
    const size = Number(params.page_size || 10)
    return ok({ count: list.length, page, page_size: size, results: list.slice((page - 1) * size, page * size).map(listItem) })
  }

  const scanMatch = route.match(/^\/scans\/([^/]+)\/$/)
  if (scanMatch) {
    const idx = db.scans.findIndex((s) => s.id === scanMatch[1] && s.user_id === user.id)
    if (idx === -1) return fail(404, { detail: 'Scan not found.' })
    if (method === 'GET') return ok(withoutOwner(db.scans[idx]))
    if (method === 'DELETE') {
      db.scans.splice(idx, 1)
      saveDb(db)
      return ok(null, 204)
    }
  }

  const feedbackMatch = route.match(/^\/scans\/([^/]+)\/feedback\/$/)
  if (method === 'PUT' && feedbackMatch) {
    const scan = db.scans.find((x) => x.id === feedbackMatch[1] && x.user_id === user.id)
    if (!scan) return fail(404, { detail: 'Scan not found.' })
    if (!['agree', 'disagree'].includes(body?.verdict)) return fail(400, { verdict: ['Choose agree or disagree.'] })
    scan.feedback = { verdict: body.verdict, actual: body.actual || 'unsure', comment: body.comment || '', updated_at: now() }
    saveDb(db)
    return ok(scan.feedback)
  }

  if (route.startsWith('/trainer/')) {
    db.trainer ??= []
    const mine = db.trainer.filter((a) => a.user_id === user.id)
    const stats = () => {
      const answered = mine.length, correct = mine.filter((a) => a.correct).length
      return { answered, correct, accuracy: answered ? Math.round((correct / answered) * 100) : 0, streak_days: answered ? 1 : 0, level: 'Learner', next_level: { name: 'Alert', answers_needed: Math.max(0, 10 - answered), accuracy_needed: 60 }, played_today: answered > 0 }
    }
    const challenges = [...MOCK_CHALLENGES]
    if (method === 'GET' && route === '/trainer/stats/') return ok(stats())
    if (method === 'GET' && route === '/trainer/round/') return ok({ challenges: challenges.sort(() => Math.random() - 0.5).slice(0, 5).map(({ answer: _a, lesson: _l, ...c }) => c), stats: stats() })
    if (method === 'POST' && route === '/trainer/answer/') {
      const c = challenges.find((x) => x.id === body?.challenge_id)
      if (!c) return fail(400, { challenge_id: ['Unknown challenge.'] })
      const correct = body.answer === c.answer
      const entry = { user_id: user.id, correct }
      db.trainer.push(entry); mine.push(entry); saveDb(db)
      const analysis = c.scan_type === 'url' ? analyzeUrl(c.text) : c.scan_type === 'mpesa' ? analyzeMpesa(c.text) : analyzeOffer(c.text, c.offer_type)
      const r = assemble(c.scan_type, c.text, c.offer_type, analysis)
      return ok({
        correct, answer: c.answer, lesson: c.lesson,
        analysis: { risk_level: r.risk_level, risk_score: r.risk_score, scam_category: r.scam_category, findings: r.findings.slice(0, 4).map(({ title, severity, source }) => ({ title, severity, source })), model: r.model_result && { model: r.model_result.model, label: r.model_result.label }, anatomy: null },
        trustshield_agrees: (r.risk_level !== 'clear') === (c.answer === 'scam'),
        stats: stats(),
      }, 201)
    }
  }

  if (method === 'GET' && route === '/dashboard/summary/') {
    const days = [7, 30, 90].includes(Number(params.days)) ? Number(params.days) : 30
    return ok(summarize(db.scans.filter((s) => s.user_id === user.id), days))
  }

  if (method === 'GET' && route === '/incidents/') {
    return ok({ results: db.incidents.filter((i) => i.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(withoutOwner) })
  }
  if (method === 'POST' && route === '/incidents/') {
    const errors = {}
    if (!body?.incident_type) errors.incident_type = ['Choose what happened.']
    if (!body?.description?.trim() || body.description.trim().length < 20) errors.description = ['Describe what happened in at least 20 characters.']
    if (!body?.consent) errors.consent = ['Confirm that you agree to store this summary.']
    if (Object.keys(errors).length) return fail(400, errors)
    const incident = {
      id: db.incidents.length + 1,
      user_id: user.id,
      reference: `TS-${new Date().getFullYear()}-${String(db.incidents.length + 1041).padStart(5, '0')}`,
      ...body,
      status: 'draft',
      created_at: now(),
    }
    db.incidents.push(incident)
    saveDb(db)
    return ok(withoutOwner(incident), 201)
  }

  if (method === 'POST' && route === '/reports/') {
    if (!body?.summary?.trim() || body.summary.trim().length < 20) return fail(400, { summary: ['Describe the scam in at least 20 characters.'] })
    const report = { id: Math.max(0, ...db.reports.map((r) => r.id)) + 1, channel: body.channel || 'mpesa', category: body.category || 'Unclassified', summary: body.summary.trim(), region: body.region || 'Not stated', indicators: [], status: 'pending', reported_at: now() }
    db.reports.push(report)
    saveDb(db)
    return ok(report, 201)
  }

  return fail(404, { detail: `No mock route for ${method} ${route}` })
}

const MOCK_CHALLENGES = [
  { id: 'mp-reversal', scan_type: 'mpesa', answer: 'scam', text: 'Confirmed. You have received Ksh 3,500.00 from JOHN KAMAU. I sent this money by mistake, please reverse it to 0712 000 111 urgently.', lesson: 'Fake reversal. Real wrong transfers are reversed through Safaricom.' },
  { id: 'mp-friend', scan_type: 'mpesa', answer: 'safe', text: 'Nimekutumia 500 ya lunch, tutaonana kesho kazini. Uko poa?', lesson: 'An ordinary note from a friend with no request.' },
  { id: 'mp-pin', scan_type: 'mpesa', answer: 'scam', text: 'SAFARICOM: Your M-PESA account will be suspended within 24 hours. Reply with your M-PESA PIN now.', lesson: 'Safaricom never asks for your PIN.' },
  { id: 'url-bonus', scan_type: 'url', answer: 'scam', text: 'http://mpesa-bonus-ke.xyz/login', lesson: 'A brand name on a cheap domain with a login page.' },
  { id: 'url-kra', scan_type: 'url', answer: 'safe', text: 'https://www.kra.go.ke', lesson: 'Government sites in Kenya end in .go.ke.' },
  { id: 'job-fee', scan_type: 'offer', offer_type: 'job', answer: 'scam', text: 'Earn Ksh 3,000 per day, no interview required. Pay a registration fee of Ksh 500 to secure your slot.', lesson: 'Employers never charge you to apply.' },
]

export function resetMockDb() {
  localStorage.removeItem(DB_KEY)
}
