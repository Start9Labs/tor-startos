import {
  ExtendedVersion,
  StartSdk,
  T,
  VersionRange,
} from '@start9labs/start-sdk'

type Sdk = ReturnType<StartSdk<T.SDKManifest>['build']>

/** The first Tor release with Set Onion Target. */
const servicesMaySetTargets = VersionRange.parse('>=0.4.9.17:4')

export type OnionTarget = {
  /** The calling package's own id. */
  packageId: T.PackageId
  hostId: T.HostId
  /** The binding whose .onion addresses are redirected. */
  internalPort: number
  /** Another port on the host, bound with no exported interface. `null` clears it. */
  target: number | null
  /** The port its .onion addresses answer on, in place of the binding's own. */
  externalPort?: number | null
}

/**
 * An init script that has Tor forward the .onion addresses of a binding to
 * another port on the same host, so the service can tell onion connections
 * from clearnet ones. It re-runs whenever Tor is installed or updated, and
 * does nothing while Tor is absent or predates the action.
 */
export function setupOnionTarget(
  sdk: Pick<Sdk, 'setupOnInit' | 'getServiceManifest' | 'action'>,
  opts: OnionTarget,
) {
  const onionTarget = {
    packageId: opts.packageId,
    hostId: opts.hostId,
    internalPort: opts.internalPort,
    target: opts.target,
    ...(opts.externalPort == null ? {} : { externalPort: opts.externalPort }),
  }
  return sdk.setupOnInit(async (effects) => {
    // The manifest precedes action registration; lifecycle changes must retry failed calls.
    const torVersion = await sdk
      .getServiceManifest(
        effects,
        'tor',
        (m) => m?.version ?? null,
        () => false,
      )
      .const()
    if (
      !torVersion ||
      !ExtendedVersion.parse(torVersion).satisfies(servicesMaySetTargets)
    )
      return

    try {
      await sdk.action.run({
        effects,
        packageId: 'tor',
        actionId: 'set-onion-target',
        input: () => ({ onionTarget }),
      })
    } catch (e) {
      console.warn(`Onion target not set yet: ${String(e)}`)
    }
  })
}
