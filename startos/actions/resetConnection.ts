import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { requestWipe } from '../utils/recovery'

export const resetConnection = sdk.Action.withoutInput(
  // id
  'reset-connection',

  // metadata
  async () => ({
    name: i18n('Reset Tor Connection'),
    description: i18n(
      'Clear the network data Tor has saved and restart it, so it picks new entry nodes. Use this if Tor is stuck connecting or keeps dropping.',
    ),
    warning: i18n(
      'Tor will be offline for a few minutes while it reconnects. Your .onion addresses are not affected.',
    ),
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  // execution
  async ({ effects }) => {
    // The wipe itself has to happen with no tor process on the volume, so it is
    // queued for the next start rather than done here.
    await requestWipe(effects)
    await sdk.restart(effects)

    return {
      version: '1' as const,
      title: i18n('Reset Started'),
      message: i18n(
        'Tor is restarting and will reconnect with new entry nodes. This takes a few minutes.',
      ),
      result: null,
    }
  },
)
