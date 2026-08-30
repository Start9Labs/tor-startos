import { i18n } from './i18n'
import { sdk } from './sdk'
import { torrc } from './fileModels/torrc'
import { socksHostId, socksPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // SOCKS5 proxy for other services. No exported interface: an unexported
  // binding stays off the LAN and lands only on lo/lxcbr0, giving dependents
  // the stable bridge address <osIp>:9050 with nothing to watch.
  await sdk.MultiHost.of(effects, socksHostId).bindPort(socksPort, {
    protocol: null,
    preferredExternalPort: socksPort,
    addSsl: null,
    secure: { ssl: false },
  })

  const relay = await torrc.read((s) => s.relay).const(effects)

  if (!relay?.enabled) return []

  const orPort = relay.orPort ?? 9001

  const orMulti = sdk.MultiHost.of(effects, 'or-multi')
  const orOrigin = await orMulti.bindPort(orPort, {
    protocol: null,
    preferredExternalPort: orPort,
    addSsl: null,
    // The OR protocol is self-securing TLS. `secure: null` would treat it as
    // plaintext and never offer the port a public address.
    secure: { ssl: false },
  })

  const orInterface = sdk.createInterface(effects, {
    name: i18n('Tor Relay OR Port'),
    id: 'or',
    description: i18n('Tor relay port for the Tor network'),
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const receipt = await orOrigin.export([orInterface])
  return [receipt]
})
