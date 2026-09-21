import { rm } from 'fs/promises'
import { dropOnionService, hsDir, torrc } from '../fileModels/torrc'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const onionHostname = (packageId: string, hostId: string, index: string) =>
  sdk.volumes.tor
    .readFile(`${hsDir(packageId, hostId, index)}/hostname`)
    .then((content) => content.toString().trim())
    .catch(() => null)

const inputSpec = InputSpec.of({
  addresses: Value.dynamicMultiselect(async () => {
    const onionServices =
      (await torrc.read((t) => t.onionServices).once()) ?? {}
    const values: Record<string, string> = {}
    for (const [packageId, hosts] of Object.entries(onionServices)) {
      for (const [hostId, services] of Object.entries(hosts ?? {})) {
        for (const [index, svc] of Object.entries(services ?? {})) {
          if (!svc) continue
          const attached = Object.values(svc.ports).some(
            (p) => p && p.target !== null,
          )
          const internalPorts = Array.from(
            new Set(
              Object.values(svc.ports).flatMap((p) =>
                p ? [p.internalPort] : [],
              ),
            ),
          )
          const hostname =
            (await onionHostname(packageId, hostId, index)) ??
            i18n('address not generated yet')
          values[`${packageId}/${hostId}/${index}`] =
            `${hostname} — ${packageId}/${hostId}:${internalPorts.join(',')}` +
            (attached ? '' : ` (${i18n('no longer attached to an interface')})`)
        }
      }
    }

    if (!Object.keys(values).length)
      return {
        name: i18n('Addresses'),
        default: [],
        values: { _none: i18n('This server hosts no .onion addresses') },
        disabled: ['_none'],
      }

    return {
      name: i18n('Addresses'),
      default: [],
      values,
      minLength: 1,
    }
  }),
})

export const deleteOnionAddresses = sdk.Action.withInput(
  // id
  'delete-onion-addresses',

  // metadata
  async () => ({
    name: i18n('Delete Onion Addresses'),
    description: i18n(
      'Delete .onion addresses this server hosts, including any no longer attached to an interface',
    ),
    warning: i18n(
      'Each address you delete is gone for good: its key is destroyed with it.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // input spec
  inputSpec,

  // pre-fill
  async () => null,

  // execution
  async ({ effects, input }) => {
    const onionServices = structuredClone(
      (await torrc.read((t) => t.onionServices).once()) ?? {},
    )
    const deleted: string[] = []
    for (const key of input.addresses) {
      const [packageId, hostId, index] = key.split('/')
      if (!onionServices[packageId]?.[hostId]?.[index]) continue
      deleted.push((await onionHostname(packageId, hostId, index)) ?? key)
      await rm(sdk.volumes.tor.subpath(hsDir(packageId, hostId, index)), {
        recursive: true,
        force: true,
      })
      dropOnionService(onionServices, packageId, hostId, index)
    }
    if (!deleted.length) throw new Error(i18n('No addresses selected'))

    await torrc.merge(effects, { onionServices })

    return {
      version: '1' as const,
      title: i18n('Onion Addresses Deleted'),
      message: deleted.join('\n'),
      result: null,
    }
  },
)
