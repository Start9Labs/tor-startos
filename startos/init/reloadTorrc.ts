import { reloadConfig } from '../utils/control'
import { torrc } from '../fileModels/torrc'
import { sdk } from '../sdk'

/**
 * Watches the torrc file and signals Tor to reload its config whenever it
 * changes, avoiding a full daemon restart.
 */
export const reloadTorrc = sdk.setupOnInit(async (effects) => {
  await torrc.read().const(effects)

  // Fix ownership on hidden service dirs — files are written as root by
  // actions, but Tor requires them owned by the tor user with mode 700
  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'tor' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'tor',
      subpath: null,
      mountpoint: '/var/lib/tor',
      readonly: false,
    }),
    'chown-tmp',
    async (sub) => {
      await sub.exec(
        [
          'sh',
          '-c',
          'chmod -R 700 /var/lib/tor/hidden_services && chown -R tor:tor /var/lib/tor/hidden_services',
        ],
        { user: 'root' },
      )
    },
  )

  await reloadConfig()
})
