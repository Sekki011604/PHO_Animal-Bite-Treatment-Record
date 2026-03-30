import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'health-form-digitizer-1uurcoz1',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_5cpZqBS84ghmKKSVgRV_JUmi1uqtItIO',
})
