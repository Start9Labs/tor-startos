import { access } from 'node:fs/promises'
import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const portShape = z.object({
  /** The port the .onion address answers on. */
  externalPort: z.number(),
  /** The binding it forwards to. The forward target itself is never stored. */
  internalPort: z.number(),
  ssl: z.boolean(),
})

const onionShape = z.object({
  /**
   * What the address forwards. Nothing here is ever removed automatically: a
   * mapping whose binding is gone is simply not rendered, and resumes if the
   * binding returns.
   */
  ports: z.array(portShape).catch([]),
})

const shape = z.object({
  /** Keyed by `onionId`. An entry that fails to parse is dropped alone. */
  onions: z
    .record(z.string(), onionShape.optional().catch(undefined))
    .catch({}),
  automaticRecovery: z.boolean().catch(true),
})

export type Onion = z.infer<typeof onionShape>
export type OnionPort = z.infer<typeof portShape>
export type Onions = Record<string, Onion>

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)

/** Named in the torrc marker. */
export const STORE_LOCATION = "store.json on this package's startos volume"

export const onionId = (packageId: string, hostId: string, index: string) =>
  `${packageId}/${hostId}/${index}`

export function parseOnionId(id: string) {
  const [packageId, hostId, index] = id.split('/')
  return { packageId, hostId, index }
}

/** The HiddenServiceDir, relative to the tor volume. */
export function hsDir(id: string) {
  const { packageId, hostId, index } = parseOnionId(id)
  return `hidden_services/${packageId}/${hostId}/hs_${index}`
}

/** The entries that parsed, without the `undefined` holes. */
export function present(onions: z.infer<typeof shape>['onions'] | null) {
  return Object.fromEntries(
    Object.entries(onions ?? {}).filter((e): e is [string, Onion] => !!e[1]),
  )
}

/** Replaces the whole onion record: `merge` cannot drop one entry of it. */
export async function writeOnions(
  effects: Parameters<typeof storeJson.write>[0],
  onions: Onions,
  options?: { allowWriteAfterConst?: boolean },
) {
  const store = await storeJson.read().once()
  await storeJson.write(
    effects,
    { ...(store ?? { automaticRecovery: true }), onions },
    options,
  )
}

/**
 * The next index for a host's onions. An index names a key directory, so one
 * that still exists on disk is skipped even when no entry claims it.
 */
export async function nextIndex(
  onions: Onions,
  packageId: string,
  hostId: string,
): Promise<string> {
  const taken = Object.keys(onions)
    .map(parseOnionId)
    .filter((o) => o.packageId === packageId && o.hostId === hostId)
    .map((o) => Number(o.index))
    .filter((n) => !isNaN(n))
  let index = taken.reduce((max, n) => Math.max(max, n + 1), 0)
  while (
    await access(
      sdk.volumes.tor.subpath(hsDir(onionId(packageId, hostId, `${index}`))),
    ).then(
      () => true,
      () => false,
    )
  )
    index += 1
  return `${index}`
}
