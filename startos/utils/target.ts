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

type OnionBinding = Pick<OnionTarget, 'packageId' | 'hostId' | 'internalPort'>

async function submit(
  sdk: Pick<Sdk, 'action'>,
  effects: T.Effects,
  torVersion: string | null,
  onionTarget: OnionBinding & Pick<OnionTarget, 'target' | 'externalPort'>,
) {
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
    console.warn(
      `Onion target not ${onionTarget.target === null ? 'cleared' : 'set'}: ${String(e)}`,
    )
  }
}

/**
 * Clears a binding's onion target and port choice, for a migration leaving a
 * version that set one: its `down`, or a cross-flavor edge out of it.
 * Does nothing while Tor is absent or predates the action.
 */
export async function clearOnionTarget(
  sdk: Pick<Sdk, 'getServiceManifest' | 'action'>,
  effects: T.Effects,
  binding: OnionBinding,
) {
  const torVersion = await sdk
    .getServiceManifest(effects, 'tor', (m) => m?.version ?? null)
    .once()
  await submit(sdk, effects, torVersion, {
    packageId: binding.packageId,
    hostId: binding.hostId,
    internalPort: binding.internalPort,
    target: null,
  })
}

/**
 * Init and uninit scripts that have Tor forward the .onion addresses of a
 * binding to another port on the same host, so the service can tell onion
 * connections from clearnet ones. Pass the result to both `setupInit` and
 * `setupUninit`.
 *
 * Init sets the target, and re-runs whenever Tor is installed or updated.
 * Uninit clears it on uninstall, the one exit StartOS gives no target
 * version; a migration leaving the version clears it with `clearOnionTarget`. Both do nothing while Tor is absent
 * or predates the action.
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
  const { init } = sdk.setupOnInit(async (effects) => {
    // The manifest precedes action registration; lifecycle changes must retry failed calls.
    const torVersion = await sdk
      .getServiceManifest(
        effects,
        'tor',
        (m) => m?.version ?? null,
        () => false,
      )
      .const()
    await submit(sdk, effects, torVersion, onionTarget)
  })
  return {
    init,
    async uninit(
      effects: T.Effects,
      target: VersionRange | ExtendedVersion | null,
    ) {
      if (target === null) await clearOnionTarget(sdk, effects, onionTarget)
    },
  }
}
