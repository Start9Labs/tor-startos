import { T } from '@start9labs/start-sdk'
import {
  hsDir,
  Onion,
  OnionPort,
  parseOnionId,
  present,
  storeJson,
  targetId,
} from '../fileModels/store.json'
import { i18n } from '../i18n'
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
export const onionHostname = (id: string, onion?: Onion) =>
  sdk.volumes.tor
    .readFile(`${hsDir(id, onion)}/hostname`)
    .then((content) => content.toString().trim())
    .catch(() => null)

type BindingState = {
  enabled: boolean
  exported: boolean
  options: { secure?: { ssl: boolean } | null }
}

export function onionPortSsl(
  port: OnionPort,
  binding: Pick<BindingState, 'options'> | null,
) {
  return port.nativeProtocol ? binding?.options.secure?.ssl === true : port.ssl
}

const bindingState = (
  effects: T.Effects,
  opts: { packageId: string; hostId: string; internalPort: number },
) =>
  sdk.host.get(
    effects,
    { hostId: opts.hostId, packageId: opts.packageId },
    (host) => {
      const binding = host?.bindings[opts.internalPort]
      return binding
        ? {
            enabled: binding.enabled,
            exported: Object.keys(binding.interfaces).length > 0,
            options: { secure: binding.options.secure },
          }
        : null
    },
  )

/**
 * The bridge address an onion port forwards to: the target its service set with
 * Set Onion Target, or the binding itself. A target that is unbound, disabled or
 * exports an interface is not served.
 */
export async function watchOnionTarget(
  effects: T.Effects,
  id: string,
  port: OnionPort,
) {
  const { packageId, hostId } = parseOnionId(id)
  const watch = (internalPort: number) =>
    bindingState(effects, { packageId, hostId, internalPort }).const()
  const binding = await watch(port.internalPort)
  if (!binding?.enabled || !binding.exported) return null
  const internalPort =
    (await storeJson
      .read((s) => s.targets?.[targetId(packageId, hostId, port.internalPort)])
      .const(effects)) ?? port.internalPort
  const target =
    internalPort === port.internalPort ? binding : await watch(internalPort)
  // An exported target is on the LAN, where clearnet clients reach it too.
  if (!target?.enabled || (target !== binding && target.exported)) return null
  const ssl = onionPortSsl(port, target)
  const address = await sdk.host
    .getBridgeAddress(effects, { packageId, hostId, internalPort, ssl })
    .const()
  return address === null ? null : { address, ssl }
}

/**
 * Whether any port of the address is on a binding that exports a service
 * interface and either resolves or is disabled. A disabled binding is not
 * served, but its service can enable it again, so its address is not unused.
 */
export async function isServed(effects: T.Effects, id: string, onion: Onion) {
  const { packageId, hostId } = parseOnionId(id)
  for (const port of onion.ports) {
    const { internalPort } = port
    const binding = await bindingState(effects, {
      packageId,
      hostId,
      internalPort,
    }).once()
    if (!binding?.exported) continue
    if (!binding.enabled) return true
    const ssl = onionPortSsl(port, binding)
    const target = await sdk.host
      .getBridgeAddress(effects, { packageId, hostId, internalPort, ssl })
      .once()
    if (target !== null) return true
  }
  return false
}

/** The addresses no interface is using. */
export async function unusedAddresses(effects: T.Effects) {
  const onions = present(await storeJson.read((s) => s.onions).once())
  const unused: string[] = []
  for (const [id, onion] of Object.entries(onions)) {
    if (!(await isServed(effects, id, onion))) unused.push(id)
  }
  return { onions, unused }
}

export async function reportUnusedAddresses(effects: T.Effects) {
  const { onions, unused } = await unusedAddresses(effects)
  if (!unused.length) return
  const lines = await Promise.all(
    unused.map(async (id) => {
      const { packageId, hostId } = parseOnionId(id)
      const hostname =
        (await onionHostname(id, onions[id])) ??
        i18n('address not generated yet')
      return `- \`${hostname}\` — ${packageId}/${hostId}`
    }),
  )
  await sdk.notification.create(effects, {
    level: 'warning',
    title: i18n('Unused .onion addresses'),
    message: i18n(
      'Some .onion addresses on this server are attached to no interface, so Tor is not publishing them.',
    ),
    data: [
      i18n(
        'Tor holds the keys of these addresses, but no interface uses them:',
      ),
      '',
      ...lines,
      '',
      i18n(
        'Addresses carried over from StartOS 0.3.5 can be among them. To publish one again, open the interface you want it on, add a .onion address, and pick the existing address from the list instead of creating a new one. **Delete Unused Onion Addresses**, in Tor’s Actions, permanently deletes the ones you no longer need.',
      ),
    ].join('\n'),
  })
}
