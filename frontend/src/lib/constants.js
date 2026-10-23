import { AlertTriangle, ShieldAlert, ShieldCheck, Smartphone, Link2, BadgePercent } from 'lucide-react'

export const RISK = {
  high: {
    key: 'high',
    label: 'High risk',
    short: 'High',
    icon: ShieldAlert,
    text: 'text-risk-high-fg',
    bg: 'bg-risk-high-bg',
    border: 'border-risk-high-line',
    solid: 'bg-risk-high',
    dot: 'var(--color-risk-high)',
    meaning: 'Multiple strong warning indicators are present. This is not proof of fraud.',
  },
  caution: {
    key: 'caution',
    label: 'Caution',
    short: 'Caution',
    icon: AlertTriangle,
    text: 'text-risk-caution-fg',
    bg: 'bg-risk-caution-bg',
    border: 'border-risk-caution-line',
    solid: 'bg-risk-caution-dot',
    dot: 'var(--color-risk-caution-dot)',
    meaning: 'Some suspicious indicators exist, but the evidence is incomplete.',
  },
  clear: {
    key: 'clear',
    label: 'No obvious warning detected',
    short: 'Clear',
    icon: ShieldCheck,
    text: 'text-risk-clear-fg',
    bg: 'bg-risk-clear-bg',
    border: 'border-risk-clear-line',
    solid: 'bg-risk-clear-dot',
    dot: 'var(--color-risk-clear-dot)',
    meaning: 'The checks found no strong indicators. The sender and transaction are still not authenticated.',
  },
}

export const SCAN_TYPES = {
  mpesa: { key: 'mpesa', label: 'M-PESA message', short: 'M-PESA', icon: Smartphone, path: '/app/mpesa' },
  url: { key: 'url', label: 'Link', short: 'Link', icon: Link2, path: '/app/links' },
  offer: { key: 'offer', label: 'Offer', short: 'Offer', icon: BadgePercent, path: '/app/offers' },
}

export const OFFER_TYPES = [
  { value: 'job', label: 'Job offer' },
  { value: 'shopping', label: 'Online shopping deal' },
  { value: 'investment', label: 'Investment or loan' },
  { value: 'other', label: 'Other offer' },
]

/* Fictional sample scenarios. None of these numbers or links are real. */
export const MPESA_SAMPLES = [
  {
    id: 'reversal',
    label: 'Fake reversal',
    text: 'Confirmed. You have received Ksh 3,500.00 from JOHN KAMAU 0712 000 111 on 14/10/26 at 9:41 PM. Hello, I have sent this money to you by mistake, please reverse it to 0712 000 111 urgently, my child is in hospital.',
  },
  {
    id: 'pin',
    label: 'PIN request',
    text: 'SAFARICOM: Your M-PESA account will be suspended within 24 hours. To keep your account active, reply with your M-PESA PIN and the OTP code sent to you now.',
  },
  {
    id: 'prize',
    label: 'Prize scam',
    text: 'CONGRATULATIONS! You have won Ksh 50,000 in the Safaricom Shangwe promotion. To claim your reward, pay a processing fee of Ksh 1,200 to till 000000 then visit http://safaricom-rewards-update.com/claim/now',
  },
  {
    id: 'genuine',
    label: 'Ordinary payment',
    text: 'Hi Wanjiru, I have just paid the Ksh 1,500 for the books. Let me know when they arrive. Thanks!',
  },
]

export const URL_SAMPLES = [
  { id: 'brand', label: 'Brand look-alike', text: 'http://safaricom-rewards-update.com/claim/now' },
  { id: 'ip', label: 'Raw IP address', text: 'http://197.0.0.12/mpesa/verify-account?id=7781' },
  { id: 'short', label: 'Shortened link', text: 'https://bit.ly/claim-bonus-ke' },
  { id: 'official', label: 'Official domain', text: 'https://www.safaricom.co.ke/personal/m-pesa' },
]

export const OFFER_SAMPLES = [
  {
    id: 'job-fee',
    offer_type: 'job',
    label: 'Job with fee',
    text: 'URGENT HIRING: Data entry clerks needed, work from home. Earn Ksh 3,000 per day, no experience or interview required. Pay a registration fee of Ksh 500 to secure your slot. Contact HR on WhatsApp only.',
  },
  {
    id: 'invest',
    offer_type: 'investment',
    label: 'Investment promise',
    text: 'Double your money in 7 days! Invest from Ksh 1,000 and receive guaranteed returns of 100%. Limited slots, offer ends tonight. Send to the agent number to join.',
  },
  {
    id: 'shop',
    offer_type: 'shopping',
    label: 'Too-cheap phone',
    text: 'Brand new iPhone for only Ksh 9,999. Pay full amount first via M-PESA and we deliver in 2 hours. Stock is limited, pay now to reserve.',
  },
  {
    id: 'legit-job',
    offer_type: 'job',
    label: 'Standard vacancy',
    text: 'We are hiring an Accounts Assistant at our Nairobi office. Applicants should hold a CPA qualification. Shortlisted candidates will be invited for an interview. Apply through our careers page by 30 November.',
  },
]
