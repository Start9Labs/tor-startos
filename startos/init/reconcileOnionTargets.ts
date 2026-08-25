import { torrc } from '../fileModels/torrc'
import { sdk } from '../sdk'

/**
 * Re-derive every onion service's forward target from the binding it was
 * created against, rewriting the torrc wherever the two have drifted apart.
 *
 * An entry's `target` is a snapshot of the binding taken when the entry was
 * written, and a binding's external ports move — a package gaining `addSsl`, an
 * OS upgrade reassigning them. Tor then forwards to a port nothing owns and
 * every connection to that .onion is refused at the SOCKS layer.
 *
 * Each target is a `getBridgeAddress` const watch, so this re-runs whenever an
 * address it forwards to changes — never on the exported-URL writes
 * `plugin/url.ts` makes against those same hosts, which touch only plugin
 * addresses and leave the bridge ones alone. It is ordered ahead of
 * `reloadTorrc` so a repair reaches Tor in the same pass that finds it.
 *
 * Key material is never touched, and a lookup that throws leaves its entry alone
 * rather than taking the service down with it.
 */
export const reconcileOnionTargets = sdk.setupOnInit(async (effects) => {
  const onionServices = await torrc.read((t) => t.onionServices).once()
  if (!onionServices) return

  const next = structuredClone(onionServices)
  const retargeted: string[] = []
  const unservable: string[] = []

  for (const [packageId, hosts] of Object.entries(next)) {
    for (const [hostId, services] of Object.entries(hosts ?? {})) {
      for (const svc of Object.values(services ?? {})) {
        if (!svc) continue
        for (const [externalPort, portInfo] of Object.entries(svc.ports)) {
          if (!portInfo) continue
          const where = `${packageId}/${hostId}:${externalPort}`

          const bridge = (ssl: boolean) =>
            sdk.host
              .getBridgeAddress(effects, {
                packageId,
                hostId,
                internalPort: portInfo.internalPort,
                ssl,
              })
              .const()

          let ssl = portInfo.ssl
          let target: string | null
          try {
            target = await bridge(ssl)
            if (target === null) {
              // The binding stopped serving the mode this entry recorded, so
              // follow the mode it does serve: the address keeps answering on
              // the port it advertises, and the annotation stops lying about it.
              ssl = !ssl
              target = await bridge(ssl)
            }
          } catch (e) {
            console.warn(`Skipping ${where}: ${String(e)}`)
            continue
          }

          if (target === null) {
            unservable.push(where)
          } else if (target !== portInfo.target || ssl !== portInfo.ssl) {
            svc.ports[externalPort] = { ...portInfo, target, ssl }
            retargeted.push(
              `${where} ${portInfo.target}${portInfo.ssl ? ' ssl' : ''} -> ${target}${ssl ? ' ssl' : ''}`,
            )
          }
        }
      }
    }
  }

  if (unservable.length) {
    console.warn(
      `Onion services whose interface no longer serves the mode they were created with, so they cannot be retargeted: ${unservable.join(
        ', ',
      )}. Re-add the address from the interface's Tor section to replace them.`,
    )
  }

  if (retargeted.length) {
    console.info(`Retargeted onion services: ${retargeted.join(', ')}`)
    await torrc.merge(effects, { onionServices: next })
  }
})
