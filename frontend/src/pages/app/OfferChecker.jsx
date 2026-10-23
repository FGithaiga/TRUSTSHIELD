import { PageHeader } from '@/components/layout/AppShell'
import { Checker } from '@/components/scan/Checker'
import { OFFER_SAMPLES, OFFER_TYPES } from '@/lib/constants'

export default function OfferChecker() {
  return (
    <>
      <PageHeader
        title="Offer Checker"
        description="Check a job, shopping deal or investment before you pay."
      />
      <Checker
        scanType="offer"
        inputLabel="Offer details"
        placeholder="Paste the job advert, product listing or investment message here."
        samples={OFFER_SAMPLES}
        offerTypes={OFFER_TYPES}
        submitLabel="Check offer"
        tips={{
          title: 'Before you accept',
          items: [
            'Real employers never charge to apply.',
            'Guaranteed returns are a red flag.',
            'Look for an official website and address.',
            'Prefer pay on delivery.',
          ],
        }}
      />
    </>
  )
}
