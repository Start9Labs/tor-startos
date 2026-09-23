import {
  parseOnionId,
  present,
  storeJson,
  writeOnions,
} from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { onionHostname, requireOwner } from '../utils/onions'

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
    warning: i18n(
      'This removes the .onion address from this interface. Its key is kept, so you can attach the address again, until you delete it with Delete Unused Onion Addresses.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
    access: 'public',
  }),

  // input spec
  inputSpec,

  // pre-fill (none needed - system provides urlPluginMetadata)
  async () => null,

  // execution
  async ({ effects, input, caller }) => {
    const { packageId, hostId, hostname, port, ssl } = input.urlPluginMetadata
    requireOwner(caller, packageId)

    const onions = present(await storeJson.read((s) => s.onions).once())

    for (const [id, onion] of Object.entries(onions)) {
      const owner = parseOnionId(id)
      if (owner.packageId !== packageId || owner.hostId !== hostId) continue
      if ((await onionHostname(id)) !== hostname) continue

      // Detach only. The key stays until the user deletes it.
      onions[id] = {
        ...onion,
        ports: onion.ports.filter(
          (p) => !(p.externalPort === port && p.ssl === ssl),
        ),
      }
      break
    }

    await writeOnions(effects, onions)
  },
)
