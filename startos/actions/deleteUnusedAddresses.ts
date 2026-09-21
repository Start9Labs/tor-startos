import { rm } from 'fs/promises'
import { T } from '@start9labs/start-sdk'
import {
  hsDir,
  parseOnionId,
  present,
  storeJson,
  writeOnions,
} from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { isServed, onionHostname } from '../utils/onions'

const { InputSpec, Value } = sdk

/** The addresses no interface is using: no port of theirs resolves. */
async function unusedAddresses(effects: T.Effects) {
  const onions = present(await storeJson.read((s) => s.onions).once())
  const unused: string[] = []
  for (const [id, onion] of Object.entries(onions)) {
    if (!(await isServed(effects, id, onion))) unused.push(id)
  }
  return { onions, unused }
}

const inputSpec = InputSpec.of({
  addresses: Value.dynamicMultiselect(async ({ effects }) => {
    const { unused } = await unusedAddresses(effects)

    if (!unused.length)
      return {
        name: i18n('Unused Addresses'),
        default: [],
        values: { _none: i18n('This server has no unused .onion addresses') },
        disabled: ['_none'],
      }

    const values: Record<string, string> = {}
    for (const id of unused) {
      const { packageId, hostId } = parseOnionId(id)
      const hostname =
        (await onionHostname(id)) ?? i18n('address not generated yet')
      values[id] = `${hostname} — ${packageId}/${hostId}`
    }
    return {
      name: i18n('Unused Addresses'),
      default: unused,
      values,
      minLength: 1,
    }
  }),
})

export const deleteUnusedAddresses = sdk.Action.withInput(
  // id
  'delete-unused-addresses',

  // metadata
  async () => ({
    name: i18n('Delete Unused Onion Addresses'),
    description: i18n(
      'Permanently delete the keys of .onion addresses that no interface is using',
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
    if (!input.addresses.length) throw new Error(i18n('No addresses selected'))

    // An address can come into use while the form is open. Delete nothing then.
    const { onions, unused } = await unusedAddresses(effects)
    const inUse = input.addresses.filter((id) => !unused.includes(id))
    if (inUse.length) {
      const names = await Promise.all(
        inUse.map(async (id) => (await onionHostname(id)) ?? id),
      )
      throw new Error(
        `${i18n('Nothing was deleted, because these addresses are now in use:')} ${names.join(', ')}`,
      )
    }

    const deleted: string[] = []
    for (const id of input.addresses) {
      deleted.push((await onionHostname(id)) ?? id)
      await rm(sdk.volumes.tor.subpath(hsDir(id)), {
        recursive: true,
        force: true,
      })
      delete onions[id]
    }

    await writeOnions(effects, onions)

    return {
      version: '1' as const,
      title: i18n('Onion Addresses Deleted'),
      message: deleted.join('\n'),
      result: null,
    }
  },
)
