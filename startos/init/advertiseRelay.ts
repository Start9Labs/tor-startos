import { torrc } from '../fileModels/torrc'
import { sdk } from '../sdk'

/**
 * Keeps what the relay advertises in step with what StartOS exposes.
 *
 * Without an `Address` line Tor advertises whatever address the directory
 * authorities see on its outbound connections, which need not be the gateway
 * the user enabled the OR port's Public address on. And when another binding
 * already held the configured port, StartOS assigns the OR binding a different
 * external port that Tor would otherwise never learn. Both come off the
 * `or-multi` binding, the way other p2p packages derive their announced
 * addresses.
 */
export const advertiseRelay = sdk.setupOnInit(async (effects) => {
  const relay = await torrc
    .read((t) => ({ enabled: t.relay.enabled, orPort: t.relay.orPort }))
    .const(effects)
  if (!relay?.enabled) return

  const exposed = await sdk.host
    .getOwn(effects, 'or-multi', (host) => {
      const binding = host?.bindings[relay.orPort]
      const iface = binding?.interfaces['or']
      if (!binding || !iface) return null
      return {
        assignedPort: binding.net.assignedPort,
        publicIps: iface.addressInfo.public
          .filter({ kind: 'ipv4' })
          .hostnames.map((h) => h.hostname),
        publicIpv6:
          iface.addressInfo.public.filter({ kind: 'ipv6' }).hostnames.length >
          0,
      }
    })
    .const()
  if (!exposed) return

  // Tor takes one Address per address family. With the Public address enabled
  // on more than one gateway there is no single right answer, so Tor keeps
  // deciding for itself.
  const publicIps = [...new Set(exposed.publicIps)]
  const port = exposed.assignedPort

  await torrc.merge(
    effects,
    {
      advertise: {
        orPort: relay.orPort,
        address: publicIps.length === 1 ? publicIps[0] : null,
        port: port !== null && port !== relay.orPort ? port : null,
        // Nothing reaches the relay over IPv6 until a public IPv6 address is
        // enabled, so until then Tor gets no IPv6 ORPort to find an address for.
        ipv4Only: !exposed.publicIpv6,
      },
    },
    { allowWriteAfterConst: true },
  )
})
