import { PageHeader } from '@/components/layout/AppShell'
import { Checker } from '@/components/scan/Checker'
import { MPESA_SAMPLES } from '@/lib/constants'

export default function MpesaChecker() {
  return (
    <>
      <PageHeader
        title="M-PESA Scam Checker"
        description="Paste a suspicious message to see its warning signs."
      />
      <Checker
        scanType="mpesa"
        inputLabel="Message to check"
        placeholder="Paste the full message here, for example: Confirmed. You have received Ksh 3,500.00 from..."
        samples={MPESA_SAMPLES}
        submitLabel="Check message"
        tips={{
          title: 'Know the signs',
          items: [
            'Safaricom never asks for your PIN or OTP.',
            'A "Confirmed" SMS is not proof. Check your balance.',
            'Wrong transfers are reversed by Safaricom, not by you.',
            'Real messages come from MPESA, not a phone number.',
          ],
        }}
      />
    </>
  )
}
