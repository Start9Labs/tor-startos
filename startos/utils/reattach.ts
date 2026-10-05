import {
  ExtendedVersion,
  IST,
  StartSdk,
  T,
  VersionRange,
} from '@start9labs/start-sdk'

type Sdk = ReturnType<StartSdk<T.SDKManifest>['build']>

/** The first Tor release whose Add Onion Service a service may run for its own hosts. */
const servicesMayAttach = VersionRange.parse('>=0.4.9.13:1')

export type OnionReattachment = {
  /** The calling package's own id. */
  packageId: T.PackageId
  /** The host whose unused .onion addresses move. Addresses never change host. */
  hostId: T.HostId
  /** The interface, and the internal port of its binding, they move to. */
  interfaceId: T.ServiceInterfaceId
  internalPort: number
  /** Whether the onion serves the binding's SSL leg, where Tor's form offers one. */
  ssl: boolean
  /** Reads the flag the migration that retired the old binding set. */
  pending: { const(effects: T.Effects): Promise<boolean | null | undefined> }
  /** Clears it, once every unused address has moved. */
  clear: (effects: T.Effects) => Promise<unknown>
}

/**
 * An init script that moves a host's unused .onion addresses to a binding,
 * keeping each hostname, after a migration retired the binding they served.
 * It waits for the flag, the binding and a Tor that allows it, and keeps the
 * flag set until the move succeeds.
 */
export function setupOnionReattachment(
  sdk: Pick<Sdk, 'setupOnInit' | 'host' | 'getServiceManifest' | 'action'>,
  opts: OnionReattachment,
) {
  const urlPluginMetadata = {
    packageId: opts.packageId,
    hostId: opts.hostId,
    interfaceId: opts.interfaceId,
    internalPort: opts.internalPort,
  }

  async function unusedOnions(effects: T.Effects): Promise<string[]> {
    const served = await sdk.host
      .get(
        effects,
        { hostId: opts.hostId, packageId: opts.packageId },
        (host) =>
          Object.values(host?.bindings ?? {}).flatMap((b) =>
            b.addresses.available
              .filter(
                (a) =>
                  a.metadata.kind === 'plugin' &&
                  a.metadata.packageId === 'tor',
              )
              .map((a) => a.hostname),
          ),
      )
      .once()
    const form = await effects.action.getInput({
      packageId: 'tor',
      actionId: 'add-onion-service',
      prefill: { urlPluginMetadata },
    })
    const address = (form?.spec as IST.InputSpec | undefined)?.address
    if (address?.type !== 'union') return []
    return Object.entries(address.variants)
      .filter(
        ([id, { name }]) =>
          id.startsWith(`${opts.packageId}/${opts.hostId}/`) &&
          !served.includes(name),
      )
      .map(([id]) => id)
  }

  return sdk.setupOnInit(async (effects) => {
    if (!(await opts.pending.const(effects))) return

    const enabled = await sdk.host
      .get(
        effects,
        { hostId: opts.hostId, packageId: opts.packageId },
        (host) => host?.bindings[opts.internalPort]?.enabled ?? false,
      )
      .const()
    if (!enabled) return

    const torVersion = await sdk
      .getServiceManifest(effects, 'tor', (m) => m?.version ?? null)
      .const()
    if (
      !torVersion ||
      !ExtendedVersion.parse(torVersion).satisfies(servicesMayAttach)
    )
      return

    try {
      for (const selection of await unusedOnions(effects)) {
        await sdk.action.run({
          effects,
          packageId: 'tor',
          actionId: 'add-onion-service',
          prefill: { urlPluginMetadata },
          input: ({ spec }) => ({
            urlPluginMetadata,
            ...('ssl' in spec ? { ssl: opts.ssl } : {}),
            address: { selection, value: {} },
          }),
        })
      }
      await opts.clear(effects)
    } catch (e) {
      console.warn(`.onion addresses not reattached yet: ${String(e)}`)
    }
  })
}
