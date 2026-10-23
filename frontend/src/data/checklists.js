import { Store, Undo2, BriefcaseBusiness, TrendingUp, Receipt } from 'lucide-react'

export const PAYMENT_SCENARIOS = [
  {
    id: 'seller',
    icon: Store,
    title: 'Paying a seller',
    text: 'Online shop, marketplace or social media seller',
    steps: [
      'Confirm the seller through a source you found yourself, not a link they sent.',
      'Check that the price is close to what established retailers charge.',
      'Prefer pay-on-delivery or an escrow option for first purchases.',
      'Confirm the name shown on the M-PESA prompt matches the business before entering your PIN.',
      'Keep screenshots of the listing, chat and payment confirmation.',
    ],
    redFlags: ['Pressure to pay within minutes', 'Payment only to a personal number', 'Price far below market value'],
  },
  {
    id: 'reversal',
    icon: Undo2,
    title: 'Asked to return money',
    text: 'Someone says they sent money to you by mistake',
    steps: [
      'Check your actual M-PESA balance on your phone. Ignore the message text.',
      'Do not send money back to the caller or to a different number.',
      'Tell the person to request a reversal through Safaricom.',
      'If the funds really arrived, let Safaricom handle the reversal.',
    ],
    redFlags: ['Caller is urgent or emotional', 'They ask you to send to a different number', 'Your balance did not change'],
  },
  {
    id: 'job',
    icon: BriefcaseBusiness,
    title: 'Job or training fee',
    text: 'Registration, medical, visa or training payment',
    steps: [
      'Verify the employer on its official website and call its listed number.',
      'For overseas jobs, confirm the recruitment agency is licensed with the relevant government authority.',
      'Ask for a written contract before paying anything.',
      'Never pay to be considered for a job or to secure an interview.',
    ],
    redFlags: ['Fee required before an interview', 'Contact only through WhatsApp or Telegram', 'Salary unusually high for the role'],
  },
  {
    id: 'investment',
    icon: TrendingUp,
    title: 'Investment or loan',
    text: 'Savings group, trading scheme or loan app',
    steps: [
      'Check that the company is licensed by the relevant financial regulator.',
      'Be wary of any guaranteed return. Real investments carry risk.',
      'Never pay an upfront fee to receive a loan.',
      'Speak to someone you trust before committing money.',
    ],
    redFlags: ['Guaranteed or doubled returns', 'Reward for recruiting others', 'Upfront fee to release a loan'],
  },
  {
    id: 'bill',
    icon: Receipt,
    title: 'Paybill or till',
    text: 'Paying a business, school or utility bill',
    steps: [
      'Get the paybill or till number from an official invoice, website or premises.',
      'Check the business name on the M-PESA confirmation prompt before entering your PIN.',
      'Use the correct account number exactly as provided by the business.',
      'Keep the confirmation message until the service is delivered.',
    ],
    redFlags: ['Paybill number changed by SMS', 'Name on prompt does not match', 'Asked to pay a personal number instead'],
  },
]
