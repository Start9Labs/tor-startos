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
 * Each target is a `getBridgeAddress` const watch and each binding's state a
 * mapped host watch, so this re-runs whenever an address it forwards to or a
 * binding it depends on changes — never on the exported-URL writes
 * `plugin/url.ts` makes against those same hosts, which touch only plugin
 * addresses and leave the bridge ones alone. It is ordered ahead of
 * `reloadTorrc` so a repair reaches Tor in the same pass that finds it.
 *
 * A port whose binding is disabled and keeps no interface an enabled binding
 * of the host does not also carry, or has no bridge-reachable address in
 * either mode, is parked — a null target, which the file writes commented
 * out — until the binding returns. Key material is never touched, and a
 * lookup that throws leaves its entry alone rather than taking the service
 * down with it.
 */
export const reconcileOnionTargets = sdk.setupOnInit(async (effects) => {
  const onionServices = await torrc.read((t) => t.onionServices).once()
  if (!onionServices) return

  const next = structuredClone(onionServices)
  const retargeted: string[] = []
  const parked: string[] = []
  const resumed: string[] = []

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
            // Boot disables every binding but moves no interface: final state.
            const superseded = await sdk.host
              .get(effects, { packageId, hostId }, (h) => {
                const binding = h?.bindings[portInfo.internalPort]
                if (!h || !binding || binding.enabled) return false
                const live = Object.values(h.bindings).filter((b) => b.enabled)
                return Object.keys(binding.interfaces).every((id) =>
                  live.some((b) => id in b.interfaces),
                )
              })
              .const()
            target = superseded ? null : await bridge(ssl)
            if (target === null && !superseded) {
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

          if (target === null) ssl = portInfo.ssl
          if (target === portInfo.target && ssl === portInfo.ssl) continue

          svc.ports[externalPort] = { ...portInfo, target, ssl }
          const to = `${target}${ssl ? ' ssl' : ''}`
          if (target === null) parked.push(where)
          else if (portInfo.target === null) resumed.push(`${where} -> ${to}`)
          else
            retargeted.push(
              `${where} ${portInfo.target}${portInfo.ssl ? ' ssl' : ''} -> ${to}`,
            )
        }
      }
    }
  }

  if (parked.length) {
    console.warn(
      `Parked onion services whose port is no longer declared or has no reachable address; they stop answering until it is back, until Delete Onion Addresses removes them, or until adding a Tor address to a current interface moves them: ${parked.join(', ')}`,
    )
  }
  if (resumed.length) {
    console.info(`Resumed onion services: ${resumed.join(', ')}`)
  }
  if (retargeted.length) {
    console.info(`Retargeted onion services: ${retargeted.join(', ')}`)
  }
  if (parked.length || resumed.length || retargeted.length) {
    await torrc.merge(effects, { onionServices: next })
  }
})
