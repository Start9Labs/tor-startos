import { storeJson, targetId } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { requireOwner } from '../utils/onions'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  onionTarget: Value.hidden<{
    packageId: string
    hostId: string
    internalPort: number
    /** Another port on the same host; `null` forwards to the binding itself. */
    target: number | null
  }>(),
})

export const setOnionTarget = sdk.Action.withInput(
  'set-onion-target',

  async () => ({
    name: i18n('Set Onion Target'),
    description: i18n(
      'Forward the .onion addresses of a service port to another of its ports',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
    access: 'public',
  }),

  inputSpec,

  async () => null,

  async ({ effects, input, caller }) => {
    const { packageId, hostId, internalPort, target } = input.onionTarget
    requireOwner(caller, packageId)
    if (target === internalPort) {
      throw new Error(
        `An onion target must be a port other than ${internalPort}`,
      )
    }
    const id = targetId(packageId, hostId, internalPort)
    await storeJson.merge(
      effects,
      { targets: { [id]: target ?? undefined } },
      { allowWriteAfterConst: true },
    )
  },
)
