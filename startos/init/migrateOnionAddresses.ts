import { rename } from 'node:fs/promises'
import { FileHelper, z } from '@start9labs/start-sdk'
import {
  hsDir,
  nextIndex,
  onionId,
  parseOnionId,
  OnionPort,
  present,
  storeJson,
  writeOnions,
} from '../fileModels/store.json'
import { sdk } from '../sdk'
import { generateOnionFiles, isClamped } from '../utils'
import { onionHostname, reportUnusedAddresses } from '../utils/onions'

const migrationEntryShape = z.looseObject({
  packageId: z.string(),
  hostId: z.string(),
  hostname: z.string(),
  key: z.string(),
  /** The ports the address answered on in StartOS 0.3.5. */
  ports: z
    .array(
      z.looseObject({ externalPort: z.number(), internalPort: z.number() }),
    )
    .optional(),
})

const migrationFile = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'onion-migration.json' },
  z.looseObject({ addresses: z.array(migrationEntryShape) }),
)

export const importedMigrationPath = sdk.volumes.startos.subpath(
  '.onion-migration.json.bak',
)

/** Imports, once, the onion addresses a StartOS 0.3.5 server carried. */
export const migrateOnionAddresses = sdk.setupOnInit(async (effects) => {
  const migration = await migrationFile.read().once()
  if (!migration?.addresses?.length) return

  console.info(
    `Found ${migration.addresses.length} onion address(es) to import`,
  )

  const onions = present(await storeJson.read((s) => s.onions).once())
  let unattached = false

  for (const {
    packageId,
    hostId,
    key,
    ports: handedOver,
  } of migration.addresses) {
    // Skip keys that aren't properly clamped
    if (!key) continue
    const keyBytes = Buffer.from(key, 'base64')
    if (keyBytes.length < 64 || !isClamped(keyBytes.subarray(0, 32))) continue

    const { secretKey, hostname } = generateOnionFiles(key)
    const existing = await Promise.all(
      Object.entries(onions)
        .filter(([id]) => {
          const owner = parseOnionId(id)
          return owner.packageId === packageId && owner.hostId === hostId
        })
        .map(([id, onion]) => onionHostname(id, onion)),
    )
    if (existing.includes(hostname)) continue

    // Keyed by external port: an address answers on each port once.
    const ports = new Map<number, OnionPort>()
    if (handedOver) {
      // 0.3.5 passed the container's protocol through, including native TLS.
      for (const { externalPort, internalPort } of handedOver)
        ports.set(externalPort, {
          externalPort,
          internalPort,
          ssl: false,
          nativeProtocol: true,
        })
    } else {
      const host = await sdk.host.get(effects, { hostId, packageId }).once()
      for (const [internalPortStr, b] of Object.entries(host?.bindings ?? {})) {
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
    }

    const id = onionId(
      packageId,
      hostId,
      await nextIndex(onions, packageId, hostId),
    )
    const dir = hsDir(id)
    await sdk.volumes.tor.writeFile(`${dir}/hs_ed25519_secret_key`, secretKey)
    await sdk.volumes.tor.writeFile(`${dir}/hostname`, hostname + '\n')
    onions[id] = { ports: [...ports.values()] }
    if (!handedOver && !ports.size) unattached = true
    console.info(`Imported onion address for ${packageId}/${hostId}`)
  }

  await writeOnions(effects, onions)

  await rename(migrationFile.path, importedMigrationPath)
  console.info('Onion address migration complete')
  if (unattached) await reportUnusedAddresses(effects)
})
