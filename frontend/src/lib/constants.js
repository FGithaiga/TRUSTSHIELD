import { AlertTriangle, ShieldAlert, ShieldCheck, Smartphone, Link2, Briefcase } from 'lucide-react'

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
  mpesa: { key: 'mpesa', label: 'SMS message', short: 'SMS', icon: Smartphone, path: '/app/mpesa' },
  url: { key: 'url', label: 'Link', short: 'Link', icon: Link2, path: '/app/links' },
  offer: { key: 'offer', label: 'Job advert', short: 'Job', icon: Briefcase, path: '/app/offers' },
}

export const OFFER_TYPES = [
  { value: 'job', label: 'Job advert' },
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
    id: 'promo',
    label: 'Promotional SMS scam',
    text: 'You have been selected for a Ksh 10,000 weekly reward. Dial *123*100# to claim now. Limited time offer!',
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

export const JOB_SAMPLES = [
  {
    id: 'job-fee',
    offer_type: 'job',
    label: 'Job with fee',
    title: 'Data entry clerk',
    company: 'Fast Track Logistics Ke',
    description: 'Work from home data entry. Earn Ksh 3,000 per day. Flexible shifts, no prior experience needed.',
    requirements: 'Must have a smartphone. Send Ksh 500 registration and interview booking fee via M-PESA to 0712 000 111 to secure your slot.',
    text: 'Job title: Data entry clerk\nCompany profile: Fast Track Logistics Ke\nJob description: Work from home data entry. Earn Ksh 3,000 per day. Flexible shifts, no prior experience needed.\nRequirements: Must have a smartphone. Send Ksh 500 registration and interview booking fee via M-PESA to 0712 000 111 to secure your slot.',
  },
  {
    id: 'whatsapp-job',
    offer_type: 'job',
    label: 'WhatsApp recruiter',
    title: 'Customer support representative',
    company: 'Apex Remote Services',
    description: 'Urgent hiring for customer care agents. High commission plus Ksh 45,000 basic pay.',
    requirements: 'Do not call. WhatsApp HR on 0722 000 111 only. Processing fee of Ksh 1,200 required for onboarding kit.',
    text: 'Job title: Customer support representative\nCompany profile: Apex Remote Services\nJob description: Urgent hiring for customer care agents. High commission plus Ksh 45,000 basic pay.\nRequirements: Do not call. WhatsApp HR on 0722 000 111 only. Processing fee of Ksh 1,200 required for onboarding kit.',
  },
  {
    id: 'legit-job',
    offer_type: 'job',
    label: 'Standard vacancy',
    title: 'Accounts Assistant',
    company: 'Nairobi Commercial Enterprise',
    description: 'We are hiring an Accounts Assistant at our Nairobi office. Responsible for ledger reconciliation, bank statements, and invoicing.',
    requirements: 'Hold a CPA Part II or equivalent business degree. Shortlisted candidates will be invited for an interview. Apply through our careers page by 30 November.',
    text: 'Job title: Accounts Assistant\nCompany profile: Nairobi Commercial Enterprise\nJob description: We are hiring an Accounts Assistant at our Nairobi office. Responsible for ledger reconciliation, bank statements, and invoicing.\nRequirements: Hold a CPA Part II or equivalent business degree. Shortlisted candidates will be invited for an interview. Apply through our careers page by 30 November.',
  },
]

export const OFFER_SAMPLES = JOB_SAMPLES
