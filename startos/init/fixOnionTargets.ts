import { torrc } from '../fileModels/torrc'
import { sdk } from '../sdk'

/**
 * Reconciles every non-SSL HiddenServicePort target in torrc against the
 * current lxcbr0 address layout of the upstream package's binding.
 *
 * Two distinct legacy/stale states this fixes:
 *
 *   1. Targets of the form `<packageId>.startos:<internalPort>` written by
 *      pre-0.4.9.8:8 add-onion-service runs. Those DNS names resolve to a
 *      sibling LXC container's private IP, which is NOT routable from the
 *      tor LXC — only the lxcbr0 gateway address is. The hidden service
 *      published fine but failed to open a stream to the target, surfaced
 *      to clients as `EndReason::MISC` and rendered as
 *      "I/O error: SOCKS: Connection refused" in app UIs.
 *
 *   2. lxcbr0 targets whose port no longer matches the current binding.
 *      Happens after an upstream package changes its `bindPort()` config
 *      (e.g. toggling `addSsl` or `protocol: 'http'`), which reshuffles
 *      the assigned external ports. Old torrc entries become stale; tor
 *      blind-forwards to a closed port and fails the same way.
 *
 * For each affected entry we pick the same target the addOnionService
 * non-SSL branch would pick today: prefer plaintext lxcbr0 ipv4, fall
 * back to any lxcbr0 ipv4 (the upstream may only expose an SSL-wrapped
 * port; tor blind-forwards bytes either way — .onion already provides
 * E2E auth).
 */
export const fixOnionTargets = sdk.setupOnInit(async (effects) => {
  console.info('[fixOnionTargets] starting reconciliation')
  const cfg = await torrc.read().once()
  if (!cfg?.onionServices) {
    console.info('[fixOnionTargets] no torrc / no onion services')
    return
  }
  console.info(`[fixOnionTargets] scanning ${Object.keys(cfg.onionServices).length} packages`)

  const updated = structuredClone(cfg.onionServices)
  let changed = 0

  for (const [packageId, hosts] of Object.entries(updated)) {
    if (packageId === 'STARTOS' || !hosts) continue

    for (const [hostId, services] of Object.entries(hosts)) {
      if (!services) continue
      for (const [, svc] of Object.entries(services)) {
        if (!svc) continue
        for (const [externalPort, port] of Object.entries(svc.ports)) {
          if (!port || port.ssl) continue

          try {
            const iface = await sdk.serviceInterface
              .getAll(effects, { packageId }, (ifaces) =>
                ifaces.filter((i) => i.addressInfo?.hostId === hostId && i.host),
              )
              .once()
            const host = iface[0]?.host
            if (!host) continue

            // We can't trust the recorded `internalPort` in torrc — the
            // parser extracts it from the target string
            // (`HiddenServicePort <ext> <host>:<port>`), which is the
            // lxcbr0 NAT port for SSL-wrapped bindings, not the upstream
            // package's internal port. Instead, locate the binding by
            // matching its `preferredExternalPort` to the torrc external
            // port (which addOnionService used as the entry key) and
            // fall back to the only-binding-on-this-host case.
            const bindingEntries = Object.entries(host.bindings)
            let binding =
              bindingEntries.find(
                ([, b]) =>
                  String(b.options.preferredExternalPort) === externalPort,
              )?.[1] ??
              (bindingEntries.length === 1 ? bindingEntries[0][1] : undefined)
            if (!binding) continue

            const lxcAddrs = binding.addresses.available.filter(
              (a) =>
                a.metadata.kind === 'ipv4' && a.metadata.gateway === 'lxcbr0',
            )
            const lxcAddr =
              lxcAddrs.find((a) => !a.ssl && a.port !== null) ??
              lxcAddrs.find((a) => a.port !== null)
            console.info(
              `[fixOnionTargets] ${packageId}/${hostId} ext:${externalPort} ` +
                `current_target:${port.target} ` +
                `lxcAddrs:${JSON.stringify(
                  lxcAddrs.map((a) => ({ ssl: a.ssl, h: a.hostname, p: a.port })),
                )}`,
            )
            if (!lxcAddr || lxcAddr.port === null) continue

            const expectedTarget = `${lxcAddr.hostname}:${lxcAddr.port}`
            // Also recompute the internalPort from the current binding
            // so subsequent reads see correct data.
            const correctInternalPort = Object.entries(host.bindings).find(
              ([, b]) => b === binding,
            )?.[0]
            const newInternalPort = correctInternalPort
              ? parseInt(correctInternalPort, 10)
              : port.internalPort
            if (
              port.target === expectedTarget &&
              port.internalPort === newInternalPort
            )
              continue

            ;(svc.ports as any)[externalPort] = {
              ...port,
              target: expectedTarget,
              internalPort: newInternalPort,
            }
            changed++
            console.info(
              `[fixOnionTargets] ${packageId}/${hostId} port ${externalPort}: ${port.target} → ${expectedTarget} (internalPort ${port.internalPort} → ${newInternalPort})`,
            )
          } catch (e) {
            console.error(`[fixOnionTargets] failed for ${packageId}/${hostId}:`, e)
          }
        }
      }
    }
  }

  if (changed > 0) {
    await torrc.merge(effects, { onionServices: updated })
    console.info(`[fixOnionTargets] rewrote ${changed} target(s); torrc updated, tor will reload`)
  } else {
    console.info('[fixOnionTargets] no changes needed')
  }
})
