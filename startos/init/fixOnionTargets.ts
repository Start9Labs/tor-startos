import { torrc } from '../fileModels/torrc'
import { sdk } from '../sdk'

/**
 * Reconciles every non-SSL HiddenServicePort target in torrc against the
 * current lxcbr0 address layout of the upstream package's binding.
 *
 * Two distinct legacy/stale states this fixes:
 *
 *   1. Targets of the form `<packageId>.startos:<internalPort>` written by
 *      pre-0.4.9.8:3 add-onion-service runs. Tor resolves a
 *      HiddenServicePort target hostname only once, at config-parse time,
 *      and caches the IP (hs_port_config_t.real_addr); it never re-resolves
 *      per connection. So these targets freeze the upstream container's
 *      DHCP IP and go stale whenever that IP changes (restart, addSsl
 *      toggle, reinstall) — tor keeps dialing the dead IP, the hidden
 *      service publishes fine but can't open a stream to the target,
 *      surfaced to clients as `EndReason::MISC` and rendered as
 *      "I/O error: SOCKS: Connection refused" in app UIs. The static
 *      lxcbr0 gateway forward has no hostname for tor to cache stale.
 *
 *   2. lxcbr0 targets whose port no longer matches the current binding.
 *      Happens after an upstream package changes its `bindPort()` config
 *      (e.g. toggling `addSsl` or `protocol: 'http'`), which reshuffles
 *      the assigned external ports. Old torrc entries become stale; tor
 *      blind-forwards to a closed port and fails the same way.
 *
 * For each affected entry we pick the same target addOnionService would
 * pick today: the plaintext (`ssl:false`) lxcbr0 ipv4 endpoint. If the
 * binding exposes no plaintext endpoint (SSL-only — addSsl or native
 * secure.ssl), a non-SSL onion has no honest target, so we delete the
 * stale record rather than wrap a plaintext onion in TLS. (The action
 * refuses to create such a record now; this cleans up any left by older
 * wrappers.) Bindings we can't currently look up (package uninstalled or
 * mid-startup) are left untouched.
 */
export const fixOnionTargets = sdk.setupOnInit(async (effects) => {
  console.info('[fixOnionTargets] starting reconciliation')
  const cfg = await torrc.read().once()
  if (!cfg?.onionServices) {
    console.info('[fixOnionTargets] no torrc / no onion services')
    return
  }
  console.info(
    `[fixOnionTargets] scanning ${Object.keys(cfg.onionServices).length} packages`,
  )

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
                ifaces.filter(
                  (i) => i.addressInfo?.hostId === hostId && i.host,
                ),
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
            const bindingEntry =
              bindingEntries.find(
                ([, b]) =>
                  String(b.options.preferredExternalPort) === externalPort,
              ) ?? (bindingEntries.length === 1 ? bindingEntries[0] : undefined)
            if (!bindingEntry) continue
            const [internalPortKey, binding] = bindingEntry

            // A non-SSL onion is only valid against a plaintext (`ssl:false`)
            // lxcbr0 endpoint. SSL-only bindings (addSsl / native secure.ssl)
            // expose none. The action refuses to create such a record now, but
            // a stale one from an older wrapper may exist — delete it rather
            // than wrap a plaintext onion in TLS.
            const plaintext = binding.addresses.available.find(
              (a) =>
                a.metadata.kind === 'ipv4' &&
                a.metadata.gateway === 'lxcbr0' &&
                !a.ssl &&
                a.port !== null,
            )
            if (!plaintext) {
              delete (svc.ports as Record<string, unknown>)[externalPort]
              changed++
              console.warn(
                `[fixOnionTargets] ${packageId}/${hostId} port ${externalPort}: SSL-only binding, no plaintext endpoint; deleting invalid non-SSL onion target ${port.target}`,
              )
              continue
            }

            const expectedTarget = `${plaintext.hostname}:${plaintext.port}`
            const internalPort = parseInt(internalPortKey, 10)
            if (
              port.target === expectedTarget &&
              port.internalPort === internalPort
            )
              continue
            ;(svc.ports as Record<string, typeof port>)[externalPort] = {
              ...port,
              target: expectedTarget,
              internalPort,
            }
            changed++
            console.info(
              `[fixOnionTargets] ${packageId}/${hostId} port ${externalPort}: ${port.target} → ${expectedTarget} (internalPort ${port.internalPort} → ${internalPort})`,
            )
          } catch (e) {
            console.error(
              `[fixOnionTargets] failed for ${packageId}/${hostId}:`,
              e,
            )
          }
        }
      }
    }
  }

  if (changed > 0) {
    await torrc.merge(effects, { onionServices: updated })
    console.info(
      `[fixOnionTargets] reconciled ${changed} target(s); torrc updated, tor will reload`,
    )
  } else {
    console.info('[fixOnionTargets] no changes needed')
  }
})
