import { FileHelper } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { addOnionService } from '../actions/addOnionService'
import { deleteOnionService } from '../actions/deleteOnionService'
import { hsDir, torrc } from '../fileModels/torrc'
import { sdk } from '../sdk'

export const registerUrlPlugin = sdk.setupOnInit(async (effects) =>
  sdk.plugin.url.register(effects, { tableAction: addOnionService }),
)

export const exportUrls = sdk.plugin.url.setupExportedUrls(
  async ({ effects }) => {
    const onionServices =
      (await torrc.read((t) => t.onionServices).const(effects)) || {}

    // Phase 1: Remove onion service entries whose target interface no longer exists
    const cleaned = structuredClone(onionServices)
    const removed: string[] = []

    for (const [packageId, hosts] of Object.entries(cleaned)) {
      if (packageId === 'STARTOS') continue

      const hostIds = await sdk.serviceInterface
        .getAll(
          effects,
          { packageId },
          (ifaces) =>
            new Set(ifaces.map((i) => i.addressInfo?.hostId).filter(Boolean)),
        )
        .const()

      for (const [hostId, services] of Object.entries(hosts)) {
        if (!hostIds.has(hostId)) {
          for (const index of Object.keys(services ?? {})) {
            await rm(sdk.volumes.tor.subpath(hsDir(packageId, hostId, index)), {
              recursive: true,
              force: true,
            })
          }
          // Set to undefined (not delete) so merge() removes the key from the file
          ;(cleaned[packageId] as any)[hostId] = undefined
          removed.push(`${packageId}/${hostId}`)
        }
      }

      if (
        Object.values(cleaned[packageId] || {}).every((v) => v === undefined)
      ) {
        ;(cleaned as any)[packageId] = undefined
      }
    }

    if (removed.length) {
      // Writing the cleaned config triggers the .const() watcher, which
      // re-invokes this function. On the second run removed is empty,
      // so Phase 2 exports the URLs. This is why we return early here.
      console.info(`Removed stale onion service entries: ${removed.join(', ')}`)
      await torrc.merge(
        effects,
        { onionServices: cleaned },
        { allowWriteAfterConst: true },
      )
      return
    }

    // Phase 2: Export URLs for all valid entries
    for (const [packageId, hosts] of Object.entries(onionServices)) {
      for (const [hostId, services] of Object.entries(hosts)) {
        for (const [i, svc] of Object.entries(services ?? {})) {
          const hostnameFile = FileHelper.string({
            base: sdk.volumes.tor,
            subpath: `${hsDir(packageId, hostId, i)}/hostname`,
          })
          const hostname = await hostnameFile.read().const(effects)
          if (!hostname) continue

          for (const [externalPort, portInfo] of Object.entries(
            svc?.ports ?? {},
          )) {
            if (!portInfo) continue
            await sdk.plugin.url
              .exportUrl(effects, {
                hostnameInfo: {
                  packageId: packageId === 'STARTOS' ? null : packageId,
                  hostId,
                  internalPort: portInfo.internalPort,
                  ssl: portInfo.ssl,
                  public: true,
                  hostname: hostname.trim(),
                  port: parseInt(externalPort, 10),
                  info: null,
                },
                removeAction: deleteOnionService,
                overflowActions: [],
              })
              .catch((e) => {
                console.error('Failed to export url', e)
              })
          }
        }
      }
    }
  },
)
