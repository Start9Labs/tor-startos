import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const WATCHDOG_FILE = '.watchdog.json'

/** The watchdog state that has to outlive the restart a wipe requires. */
export const watchdogState = FileHelper.json(
  { base: sdk.volumes.tor, subpath: WATCHDOG_FILE },
  z.object({
    /** A wipe is queued for the next start, where no tor process holds the volume. */
    wipeRequested: z.boolean().catch(false),
    /** The watchdog already wiped during this outage; it does not wipe twice. */
    autoWiped: z.boolean().catch(false),
  }),
)
