import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const stopUsingBridges = sdk.Action.withoutInput(
  // id
  'stop-using-bridges',

  // metadata
  async ({ effects }) => ({
    name: i18n('Stop Using Bridges'),
    description: i18n('Connect to the Tor network directly, without bridges'),
    warning: i18n(
      'Tor will forget your bridges and connect to the Tor network directly, which your internet provider can see. On a network that blocks Tor, it cannot connect, and neither can anything that depends on it.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: (await storeJson.read((s) => s.bridges).const(effects))?.length
      ? 'enabled'
      : 'hidden',
  }),

  // execution
  async ({ effects }) => {
    await storeJson.merge(effects, { bridges: [] })
  },
)
