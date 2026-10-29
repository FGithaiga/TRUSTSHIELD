import { PageHeader } from '@/components/layout/AppShell'
import { Checker } from '@/components/scan/Checker'
import { JOB_SAMPLES } from '@/lib/constants'

export default function OfferChecker() {
  return (
    <>
      <PageHeader
        title="Job Advert Checker"
        description="Verify recruitment offers and job adverts with the fake-job ML detection model."
      />
      <Checker
        scanType="offer"
        inputLabel="Job Advert Details"
        placeholder="Paste the job vacancy, recruitment message, or employment offer here..."
        samples={JOB_SAMPLES}
        submitLabel="Check job advert"
        tips={{
          title: 'Before you apply or pay',
          items: [
            'Real employers never ask for application, training, or medical clearance fees.',
            'Be skeptical of recruiters who communicate only through WhatsApp or personal mobile numbers.',
            'Verify the vacancy on the organization\'s official careers portal.',
            'Unrealistically high salaries with zero interview or experience requirements are a classic lure.',
          ],
        }}
      />
    </>
  )
}
