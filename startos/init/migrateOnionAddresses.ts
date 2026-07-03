import { rename } from 'node:fs/promises'
import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { hsDir, nextKey, torrc } from '../fileModels/torrc'
import { generateOnionFiles, isClamped } from '../utils'

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

    const defaultHost = `${packageId}.startos`

    const hosts = await sdk.serviceInterface
      .getAll(effects, { packageId }, (ifaces) =>
        ifaces
          .filter((i) => i.addressInfo?.hostId === hostId && i.host)
          .map((i) => i.host!),
      )
      .once()

    const host = hosts[0]
    if (!host) continue // package not installed, skip

    const ports: Record<
      string,
      { target: string; ssl: boolean; internalPort: number }
    > = {}
    for (const [internalPort, b] of Object.entries(host.bindings)) {
      if (b.enabled) {
        // TODO(beta.10): switch the plaintext target to the static lxcbr0
        // plaintext gateway endpoint once StartOS surfaces it. Matches
        // addOnionService.
        if (b.options.secure?.ssl === true) {
          // Native-SSL binding: the service terminates its own TLS on its
          // port, so the onion forwards raw TCP straight to it, flagged ssl.
          ports[String(b.options.preferredExternalPort)] = {
            target: `${defaultHost}:${Number(internalPort)}`,
            ssl: true,
            internalPort: Number(internalPort),
          }
        } else {
          ports[String(b.options.preferredExternalPort)] = {
            target: `${defaultHost}:${Number(internalPort)}`,
            ssl: false,
            internalPort: Number(internalPort),
          }
        }
        if (b.options.addSsl) {
          ports[String(b.options.addSsl.preferredExternalPort)] = {
            target: `startos:${b.net.assignedSslPort}`,
            ssl: true,
            internalPort: Number(internalPort),
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
