import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const setting = storeJson.read((s) => s.automaticRecovery)

export const automaticRecovery = sdk.Action.withoutInput(
  // id
  'automatic-recovery',

  // metadata
  async ({ effects }) => {
    const on = (await setting.const(effects)) ?? true
    return {
      name: on
        ? i18n('Turn Off Automatic Recovery')
        : i18n('Turn On Automatic Recovery'),
      description: on
        ? i18n(
            'Automatic Recovery is on. When Tor loses its connection and cannot get it back, this service repairs it for you, so your services stay reachable without your attention.',
          )
        : i18n(
            'Automatic Recovery is off, so Tor fails closed. If Tor gets stuck it stays offline, along with everything that depends on it, until you run Reset Tor Connection.',
          ),
      warning: on
        ? i18n(
            'Turning this off makes Tor fail closed. If Tor gets stuck, it stays offline, along with everything that depends on it, until you run Reset Tor Connection. In exchange, no one can use automatic repairs to work out that your .onion addresses are hosted on this server. Turn it off only if hiding this server’s location matters more to you than staying reachable.',
          )
        : i18n(
            'With this on, your services stay reachable without your attention. The cost: someone able to repeatedly interrupt this server’s internet connection, such as an internet provider, could use the automatic repairs to eventually work out that your .onion addresses are hosted here.',
          ),
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  // execution
  async ({ effects }) => {
    const on = !((await setting.once()) ?? true)
    await storeJson.merge(effects, { automaticRecovery: on })

    return {
      version: '1' as const,
      title: on
        ? i18n('Automatic Recovery Is On')
        : i18n('Automatic Recovery Is Off'),
      message: on
        ? i18n('Tor will repair a stuck connection without you.')
        : i18n(
            'Tor now fails closed: a stuck connection stays down until you run Reset Tor Connection.',
          ),
      result: null,
    }
  },
)
