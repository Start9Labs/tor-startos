import { T } from '@start9labs/start-sdk'
import { hsDir, Onion, parseOnionId } from '../fileModels/store.json'
import { sdk } from '../sdk'

/**
 * Throws unless the user, or the service that owns the address, is asking.
 * A caller is the id of the service that ran the action; `null` is the user.
 */
export function requireOwner(caller: string | null, packageId?: string) {
  if (caller !== null && caller !== packageId) {
    throw new Error(
      `${caller} can only manage its own onion addresses, not those of ${packageId ?? 'another service'}`,
    )
  }
}

/** The address's .onion hostname, or null before its key is written. */
export const onionHostname = (id: string) =>
  sdk.volumes.tor
    .readFile(`${hsDir(id)}/hostname`)
    .then((content) => content.toString().trim())
    .catch(() => null)

/**
 * Whether a binding is enabled, or null when its host or the binding is gone.
 * StartOS keeps a disabled binding's port and bridge address, so a resolved
 * bridge address alone does not mean anything is listening.
 */
export const bindingEnabled = (
  effects: T.Effects,
  opts: { packageId: string; hostId: string; internalPort: number },
) =>
  sdk.host.get(
    effects,
    { hostId: opts.hostId, packageId: opts.packageId },
    (host) => host?.bindings[opts.internalPort]?.enabled ?? null,
  )

/**
 * Whether any port of the address belongs to its service right now: an enabled
 * binding that resolves, or a disabled one. A disabled binding is not served,
 * but its service still holds the port and can enable it again, so its address
 * is not unused.
 */
export async function isServed(effects: T.Effects, id: string, onion: Onion) {
  const { packageId, hostId } = parseOnionId(id)
  for (const { internalPort, ssl } of onion.ports) {
    const enabled = await bindingEnabled(effects, {
      packageId,
      hostId,
      internalPort,
    })
      .once()
      .catch(() => null)
    if (enabled === false) return true
    if (enabled === null) continue
    const target = await sdk.host
      .getBridgeAddress(effects, { packageId, hostId, internalPort, ssl })
      .once()
      .catch(() => null)
    if (target !== null) return true
  }
  return false
}
