import { FileHelper } from '@start9labs/start-sdk'
import { addOnionService } from '../actions/addOnionService'
import { deleteOnionService } from '../actions/deleteOnionService'
import {
  hsDir,
  parseOnionId,
  present,
  storeJson,
} from '../fileModels/store.json'
import { sdk } from '../sdk'

export const registerUrlPlugin = sdk.setupOnInit(async (effects) =>
  sdk.plugin.url.register(effects, { tableAction: addOnionService }),
)

/**
 * Exports every onion to the interface it serves. An address whose host or
 * binding is absent is skipped, not removed: nothing here deletes a mapping or
 * a key, so a service that is restored, reinstalled or re-bound later gets its
 * address back, and a key goes only when the user deletes it.
 */
export const exportUrls = sdk.plugin.url.setupExportedUrls(
  async ({ effects }) => {
    const onions = present(await storeJson.read((s) => s.onions).const(effects))

    for (const [id, onion] of Object.entries(onions)) {
      const { packageId, hostId } = parseOnionId(id)

      // Map to the bound ports before `.const()`: exporting a URL writes to
      // this same host, and a watch on the whole host would re-fire on it.
      const bound = await sdk.host
        .get(effects, { hostId, packageId }, (host) =>
          host ? Object.keys(host.bindings).map(Number) : null,
        )
        .const()
        .catch((e) => {
          console.warn(`Not exporting ${id}: ${String(e)}`)
          return null
        })
      if (bound === null) continue

      const hostname = await FileHelper.string({
        base: sdk.volumes.tor,
        subpath: `${hsDir(id)}/hostname`,
      })
        .read()
        .const(effects)
      if (!hostname) continue

      for (const port of onion.ports) {
        if (!bound.includes(port.internalPort)) continue
        await sdk.plugin.url
          .exportUrl(effects, {
            hostnameInfo: {
              packageId,
              hostId,
              internalPort: port.internalPort,
              ssl: port.ssl,
              public: true,
              hostname: hostname.trim(),
              port: port.externalPort,
              info: null,
            },
            removeAction: deleteOnionService,
            overflowActions: [],
          })
          .catch((e) => console.error(`Failed to export ${id}`, e))
      }
    }
  },
)
