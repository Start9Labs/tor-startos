import { sdk } from './sdk'
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

  return []
})
