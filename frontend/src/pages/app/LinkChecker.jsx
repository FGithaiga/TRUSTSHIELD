import { PageHeader } from '@/components/layout/AppShell'
import { Checker } from '@/components/scan/Checker'
import { URL_SAMPLES } from '@/lib/constants'

export default function LinkChecker() {
  return (
    <>
      <PageHeader
        title="Inspect any URL"
        description="Check a link before you click. We never open it."
      />
      <Checker scanType="url" inputLabel="URL to check" placeholder="http://example.com/claim/now" samples={URL_SAMPLES} submitLabel="Check link" />
    </>
  )
}
