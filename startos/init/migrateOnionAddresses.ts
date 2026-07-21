import { rename } from 'node:fs/promises'
import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { hsDir, nextKey, torrc } from '../fileModels/torrc'
import { bridgeHost, generateOnionFiles, isClamped } from '../utils'

const migrationEntryShape = z.object({
  packageId: z.string(),
  hostId: z.string(),
  hostname: z.string(),
  key: z.string(),
})

const migrationFile = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'onion-migration.json' },
  z.object({ addresses: z.array(migrationEntryShape) }),
)

export const migrateOnionAddresses = sdk.setupOnInit(async (effects) => {
  const migration = await migrationFile.read().once()
  if (!migration?.addresses?.length) return

  console.info(
    `Found ${migration.addresses.length} onion address(es) to import`,
  )

  const config = await torrc.read().once()
  const onionServices = structuredClone(config?.onionServices || {})

  for (const entry of migration.addresses) {
    const { packageId, hostId, key } = entry

    // Skip keys that aren't properly clamped
    if (!key) continue
    const keyBytes = Buffer.from(key, 'base64')
    if (keyBytes.length < 64 || !isClamped(keyBytes.subarray(0, 32))) continue

    const host = await sdk.host.get(effects, { hostId, packageId }).once()
    if (!host) continue // package/host not installed, skip

    const ports: Record<
      string,
      { target: string; ssl: boolean; internalPort: number }
    > = {}
    for (const [internalPortStr, b] of Object.entries(host.bindings)) {
      if (!b.enabled) continue
      const internalPort = Number(internalPortStr)

      // Primary onion port. A native-SSL binding terminates its own TLS, so the
      // onion forwards raw TCP to it (flagged ssl); everything else is
      // plaintext. Both reach the target over the LXC bridge — the deprecated
      // `<pkg>.startos` container hostname is gone.
      const nativeSsl = b.options.secure?.ssl === true
      const primary = bridgeHost(host, internalPort, nativeSsl)
      if (primary) {
        ports[String(b.options.preferredExternalPort)] = {
          target: `${primary.hostname}:${primary.port}`,
          ssl: nativeSsl,
          internalPort,
        }
      }

      // addSsl bindings also expose an OS-terminated SSL port over the bridge.
      if (b.options.addSsl) {
        const sslAddr = bridgeHost(host, internalPort, true)
        if (sslAddr) {
          ports[String(b.options.addSsl.preferredExternalPort)] = {
            target: `${sslAddr.hostname}:${sslAddr.port}`,
            ssl: true,
            internalPort,
          }
        }
      }
    }

    if (!onionServices[packageId]) onionServices[packageId] = {}
    if (!onionServices[packageId][hostId]) onionServices[packageId][hostId] = {}

    const entryKey = nextKey(onionServices[packageId][hostId]!)
    onionServices[packageId][hostId]![entryKey] = { ports }

    const dir = hsDir(packageId, hostId, entryKey)
    const { secretKey, hostname } = generateOnionFiles(key)
    await sdk.volumes.tor.writeFile(`${dir}/hs_ed25519_secret_key`, secretKey)
    await sdk.volumes.tor.writeFile(`${dir}/hostname`, hostname + '\n')
    console.info(`Imported onion address for ${packageId}/${hostId}`)
  }

  await torrc.merge(effects, { onionServices })

  await rename(
    migrationFile.path,
    sdk.volumes.startos.subpath('.onion-migration.json.bak'),
  )
  console.info('Onion address migration complete')
})
