import { rename } from 'node:fs/promises'
import { FileHelper, z } from '@start9labs/start-sdk'
import {
  hsDir,
  nextIndex,
  onionId,
  OnionPort,
  present,
  storeJson,
  writeOnions,
} from '../fileModels/store.json'
import { sdk } from '../sdk'
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

/** Imports, once, the onion addresses a StartOS 0.3.5 server carried. */
export const migrateOnionAddresses = sdk.setupOnInit(async (effects) => {
  const migration = await migrationFile.read().once()
  if (!migration?.addresses?.length) return

  console.info(
    `Found ${migration.addresses.length} onion address(es) to import`,
  )

  const onions = present(await storeJson.read((s) => s.onions).once())

  for (const { packageId, hostId, key } of migration.addresses) {
    // Skip keys that aren't properly clamped
    if (!key) continue
    const keyBytes = Buffer.from(key, 'base64')
    if (keyBytes.length < 64 || !isClamped(keyBytes.subarray(0, 32))) continue

    const host = await sdk.host.get(effects, { hostId, packageId }).once()
    if (!host) continue // package/host not installed, skip

    // Keyed by external port: an address answers on each port once.
    const ports = new Map<number, OnionPort>()
    for (const [internalPortStr, b] of Object.entries(host.bindings)) {
      if (!b.enabled) continue
      const internalPort = Number(internalPortStr)
      // A native-SSL binding terminates its own TLS and has no plaintext leg;
      // an addSsl binding also offers an OS-terminated SSL port.
      ports.set(b.options.preferredExternalPort, {
        externalPort: b.options.preferredExternalPort,
        internalPort,
        ssl: b.options.secure?.ssl === true,
      })
      if (b.options.addSsl) {
        ports.set(b.options.addSsl.preferredExternalPort, {
          externalPort: b.options.addSsl.preferredExternalPort,
          internalPort,
          ssl: true,
        })
      }
    }

    const id = onionId(
      packageId,
      hostId,
      await nextIndex(onions, packageId, hostId),
    )
    const { secretKey, hostname } = generateOnionFiles(key)
    const dir = hsDir(id)
    await sdk.volumes.tor.writeFile(`${dir}/hs_ed25519_secret_key`, secretKey)
    await sdk.volumes.tor.writeFile(`${dir}/hostname`, hostname + '\n')
    onions[id] = { ports: [...ports.values()] }
    console.info(`Imported onion address for ${packageId}/${hostId}`)
  }

  await writeOnions(effects, onions)

  await rename(
    migrationFile.path,
    sdk.volumes.startos.subpath('.onion-migration.json.bak'),
  )
  console.info('Onion address migration complete')
})
