import { z } from '@start9labs/start-sdk'
import {
  parseOnionId,
  present,
  storeJson,
  targetId,
} from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  isAddedSslPort,
  requireAvailableOnionPort,
  requireOwner,
} from '../utils/onions'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  onionTarget: Value.hidden(
    z.looseObject({
      packageId: z.string(),
      hostId: z.string(),
      internalPort: z.number(),
      target: z.number().int().min(1).max(65535).nullable(),
      externalPort: z.number().int().min(1).max(65535).nullish(),
    }),
  ),
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
    const {
      packageId,
      hostId,
      internalPort,
      target,
      externalPort = null,
    } = input.onionTarget
    requireOwner(caller, packageId)
    if (target === internalPort) {
      throw new Error(
        `An onion target must be a port other than ${internalPort}`,
      )
    }
    const id = targetId(packageId, hostId, internalPort)
    const store = await storeJson.read().once()
    const binding = await sdk.host
      .get(
        effects,
        { hostId, packageId },
        (host) => host?.bindings[internalPort] ?? null,
      )
      .once()
    const to = externalPort ?? binding?.options.preferredExternalPort

    // Native legs move regardless of their historical port; addSsl legs retain theirs.
    const onions = present(store?.onions ?? null)
    let moved = false
    if (to !== undefined) {
      for (const [onion, entry] of Object.entries(onions)) {
        const owner = parseOnionId(onion)
        if (owner.packageId !== packageId || owner.hostId !== hostId) continue
        const moves = (p: (typeof entry.ports)[number]) =>
          p.internalPort === internalPort && !isAddedSslPort(p, binding)
        if (!entry.ports.some(moves)) continue
        requireAvailableOnionPort(
          entry.ports.filter((p) => !moves(p)),
          to,
        )
        onions[onion] = {
          ...entry,
          ports: entry.ports.map((p) =>
            moves(p) ? { ...p, externalPort: to } : p,
          ),
        }
        moved ||= entry.ports.some((p) => moves(p) && p.externalPort !== to)
      }
    }

    // The choice and existing mappings must commit together.
    await storeJson.merge(
      effects,
      {
        ...(moved ? { onions } : {}),
        targets: { [id]: target ?? undefined },
        ...(externalPort !== null || store?.externalPorts?.[id] !== undefined
          ? { externalPorts: { [id]: externalPort ?? undefined } }
          : {}),
      },
      { allowWriteAfterConst: true },
    )
  },
)
