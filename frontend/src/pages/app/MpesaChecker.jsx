import { PageHeader } from '@/components/layout/AppShell'
import { Checker } from '@/components/scan/Checker'
import { MPESA_SAMPLES } from '@/lib/constants'

export default function MpesaChecker() {
  return (
    <>
      <PageHeader
        title="SMS Scam Checker"
        description="Paste any suspicious SMS or text message to check for scam indicators — from mobile money reversals to promotional texts."
      />
      <Checker
        scanType="mpesa"
        inputLabel="SMS message to check"
        placeholder="Paste the full message here, for example: CONGRATULATIONS! You have won Ksh 50,000. Pay a processing fee to claim."
        samples={MPESA_SAMPLES}
        submitLabel="Check message"
        tips={{
          title: 'Know the signs',
          items: [
            'Never share your PIN, OTP, or password in response to a text.',
            'A "Confirmed" SMS is not proof — check your own balance.',
            'Wrong transfers are reversed by Safaricom, not by you.',
            'Unexpected prizes or fees are common scam lures.',
            'Be wary of messages sent from a phone number instead of an official sender ID.',
          ],
        }}
      />
    </>
  )
}
