import { rm } from 'fs/promises'
import { dropOnionService, hsDir, torrc } from '../fileModels/torrc'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  urlPluginMetadata: Value.hidden<{
    interfaceId: string
    packageId: string
    hostId: string
    internalPort: number
    ssl: boolean
    public: boolean
    hostname: string
    port: number | null
    info: unknown
  }>(),
})

export const deleteOnionService = sdk.Action.withInput(
  // id
  'delete-onion-service',

  // metadata
  async () => ({
    name: i18n('Delete Onion Service'),
    description: i18n('Remove a Tor onion service'),
    warning: i18n('Confirm you would like to delete this .onion address'),
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
  }),

  // input spec
  inputSpec,

  // pre-fill (none needed - system provides urlPluginMetadata)
  async () => null,

  // execution
  async ({ effects, input }) => {
    const { packageId, hostId, hostname, port, ssl } = input.urlPluginMetadata

    const config = await torrc.read().once()
    const onionServices = structuredClone(config?.onionServices || {})
    const services = onionServices[packageId]?.[hostId]
    if (!services) return

    for (const [key, svc] of Object.entries(services)) {
      if (!svc) continue
      let onionHostname: string | undefined
      try {
        const content = await sdk.volumes.tor.readFile(
          `${hsDir(packageId, hostId, key)}/hostname`,
        )
        onionHostname = content.toString().trim()
      } catch {
        continue
      }

      if (onionHostname !== hostname) continue

      // Found the matching entry — remove the specific port
      // Use undefined (not delete) so merge() removes the key from the file
      const portKey = port !== null ? String(port) : null
      if (portKey && svc.ports[portKey]) {
        const portInfo = svc.ports[portKey]
        if ((portInfo.ssl || false) === ssl) {
          ;(svc.ports as any)[portKey] = undefined
        }
      }

      // If no ports remain, remove the entire entry and key material
      if (Object.values(svc.ports).every((v) => v === undefined)) {
        await rm(sdk.volumes.tor.subpath(hsDir(packageId, hostId, key)), {
          recursive: true,
          force: true,
        })
        dropOnionService(onionServices, packageId, hostId, key)
      }
      break
    }

    await torrc.merge(effects, { onionServices })
  },
)
