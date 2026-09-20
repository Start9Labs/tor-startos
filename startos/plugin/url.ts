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

    // Phase 1: Remove onion service entries whose target package no longer exists
    const cleaned = structuredClone(onionServices)
    const removed: string[] = []
    const pending = new Set<string>()

    for (const [packageId, hosts] of Object.entries(cleaned)) {
      if (!hosts) continue

      for (const [hostId, services] of Object.entries(hosts)) {
        // A missing host is a package that was uninstalled — or one whose
        // restore has not bound it yet: a batch restore writes every package's
        // entry before any of them inits. Only the package's absence proves an
        // uninstall. A thrown lookup (e.g. a legacy entry the OS can't resolve)
        // keeps the entry and its key material.
        //
        // Map to existence before `.const()`: Phase 2's `exportUrl` mutates the
        // target host (its exported-URL set), which this watch observes.
        // Subscribing to the whole host would re-fire on our own writes and spin
        // this pass indefinitely; the boolean only flips when a host actually
        // appears or disappears.
        let hostExists: boolean
        try {
          hostExists = await sdk.host
            .get(effects, { hostId, packageId }, (host) => !!host)
            .const()
        } catch (e) {
          console.warn(
            `Skipping cleanup for ${packageId}/${hostId}: ${String(e)}`,
          )
          continue
        }
        if (hostExists) continue // host still exists — keep the onion

        // Read once: a status watch would re-fire on every health tick of the
        // target, and the host watch above already fires when the host arrives.
        let installed: boolean
        try {
          installed =
            (await sdk.getStatus(effects, { packageId }).once()) !== null
        } catch (e) {
          console.warn(
            `Skipping cleanup for ${packageId}/${hostId}: ${String(e)}`,
          )
          continue
        }
        if (installed) {
          pending.add(`${packageId}/${hostId}`)
          continue
        }

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

      if (
        Object.values(cleaned[packageId] || {}).every((v) => v === undefined)
      ) {
        ;(cleaned as any)[packageId] = undefined
      }
    }

    // Persist the cleaned config if we dropped any stale entries. We must NOT
    // return early here: setupExportedUrls calls clearUrls({ except }) with the
    // URLs exported during this run, so returning before Phase 2 would leave
    // `except` empty and transiently wipe every package's onion from every host
    // — firing host-info watchers and restarting every service that watches its
    // own address. Instead we fall through and export the survivors in the same
    // pass, so clearUrls only prunes the genuinely-stale entries.
    if (removed.length) {
      console.info(`Removed stale onion service entries: ${removed.join(', ')}`)
      await torrc.merge(
        effects,
        { onionServices: cleaned },
        { allowWriteAfterConst: true },
      )
    }

    if (pending.size) {
      console.info(
        `Keeping onion services whose host is not bound yet: ${[...pending].join(', ')}`,
      )
    }

    // Phase 2: Export URLs for all surviving entries whose host exists
    for (const [packageId, hosts] of Object.entries(cleaned)) {
      if (!hosts) continue
      for (const [hostId, services] of Object.entries(hosts)) {
        if (pending.has(`${packageId}/${hostId}`)) continue
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
            if (!portInfo || portInfo.target === null) continue
            await sdk.plugin.url
              .exportUrl(effects, {
                hostnameInfo: {
                  packageId,
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
