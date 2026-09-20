import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { socksPort } from '../utils'

const portInfoShape = z.object({
  target: z.string(),
  ssl: z.boolean(),
  internalPort: z.number(),
})

export const onionServiceEntryShape = z
  .object({
    ports: z.record(z.string(), portInfoShape.optional().catch(undefined)),
  })
  .catch({ ports: {} })

export const relayShape = z.object({
  enabled: z.boolean().catch(false),
  nickname: z.string().min(1).optional().catch(undefined),
  contactInfo: z.string().optional().catch(undefined),
  bridge: z.boolean().catch(false),
  orPort: z.number().catch(9001),
  bandwidthRate: z.number().catch(1024),
  bandwidthBurst: z.number().catch(2048),
})

const shape = z.object({
  onionServices: z
    .record(
      z.string(),
      z
        .record(
          z.string(),
          z
            .record(
              z.string(),
              onionServiceEntryShape.optional().catch(undefined),
            )
            .optional()
            .catch(undefined),
        )
        .optional()
        .catch(undefined),
    )
    .catch({}),
  relay: relayShape.catch({
    enabled: false,
    bridge: false,
    orPort: 9001,
    bandwidthRate: 1024,
    bandwidthBurst: 2048,
  }),
  // Not user configuration: what the relay advertises, derived from the OR
  // binding by init/advertiseRelay. `orPort` is the configured port it was
  // derived for, so changing the OR port drops it until it is derived again.
  advertise: z
    .object({
      orPort: z.number().nullable().catch(null),
      address: z.string().nullable().catch(null),
      port: z.number().nullable().catch(null),
      ipv4Only: z.boolean().catch(false),
    })
    .catch({ orPort: null, address: null, port: null, ipv4Only: false }),
})

export type TorrcConfig = z.infer<typeof shape>

export function hsDir(packageId: string, hostId: string, index: string) {
  return `hidden_services/${packageId}/${hostId}/hs_${index}`
}

/**
 * Marks an entry `undefined` in place, which `merge` drops from the file, and
 * does the same to the host and package records it empties.
 */
export function dropOnionService(
  onionServices: TorrcConfig['onionServices'],
  packageId: string,
  hostId: string,
  index: string,
) {
  const hosts = onionServices[packageId]
  const services = hosts?.[hostId]
  if (!hosts || !services) return
  ;(services as any)[index] = undefined
  if (Object.values(services).every((v) => v === undefined))
    (hosts as any)[hostId] = undefined
  if (Object.values(hosts).every((v) => v === undefined))
    (onionServices as any)[packageId] = undefined
}

/**
 * Returns the next sequential numeric key (as a string) for a record.
 * Gaps from deleted keys are intentionally NOT reused, since keys map to
 * HiddenServiceDir paths containing cryptographic key material.
 */
export function nextKey(record: Record<string, unknown>): string {
  return String(
    Object.keys(record)
      .map(Number)
      .filter((n) => !isNaN(n))
      .reduce((acc, x) => (x >= acc ? x + 1 : acc), 0),
  )
}

/**
 * Serializes structured config to a torrc file.
 * Embeds `# @service`, `# @ssl`, and `# @internalPort` comment annotations so
 * fromFile() can reconstruct the structured data (packageId, hostId, SSL
 * status, upstream internal port) on read.
 */
function toFile(config: TorrcConfig): string {
  const lines: string[] = [
    `SocksPort 0.0.0.0:${socksPort}`,
    'DataDirectory /var/lib/tor',
    'ControlSocket /var/lib/tor/control.sock',
    '',
  ]

  const onionServices = config.onionServices || {}
  for (const [packageId, hosts] of Object.entries(onionServices)) {
    if (!hosts) continue
    for (const [hostId, services] of Object.entries(hosts)) {
      if (!services) continue
      Object.entries(services).forEach(([index, svc]) => {
        if (!svc) return
        if (Object.keys(svc.ports).length === 0) return
        lines.push(`# @service ${packageId} ${hostId}`)
        lines.push(
          `HiddenServiceDir /var/lib/tor/${hsDir(packageId, hostId, index)}/`,
        )
        for (const [externalPort, portInfo] of Object.entries(svc.ports)) {
          if (!portInfo) continue
          if (portInfo.ssl) lines.push(`# @ssl ${portInfo.internalPort}`)
          else lines.push(`# @internalPort ${portInfo.internalPort}`)
          lines.push(`HiddenServicePort ${externalPort} ${portInfo.target}`)
        }
        lines.push('')
      })
    }
  }

  const relay = config.relay
  if (relay?.enabled) {
    const advertise =
      config.advertise?.orPort === relay.orPort ? config.advertise : null
    // StartOS may assign the binding a different external port than the one
    // Tor listens on: advertise the assigned port, listen on the configured one.
    // A bare ORPort is an IPv6 ORPort too, and with no IPv6 address to publish
    // Tor logs a notice about it every hour.
    const family = advertise?.ipv4Only ? ' IPv4Only' : ''
    if (advertise?.port && advertise.port !== relay.orPort) {
      lines.push(`ORPort ${advertise.port} NoListen${family}`)
      lines.push(`ORPort ${relay.orPort} NoAdvertise${family}`)
    } else {
      lines.push(`ORPort ${relay.orPort}${family}`)
    }
    if (advertise?.address) lines.push(`Address ${advertise.address}`)
    if (relay.nickname) lines.push(`Nickname ${relay.nickname}`)
    if (relay.contactInfo) lines.push(`ContactInfo ${relay.contactInfo}`)
    if (relay.bridge) lines.push('BridgeRelay 1')
    lines.push(`RelayBandwidthRate ${relay.bandwidthRate} KBytes`)
    lines.push(`RelayBandwidthBurst ${relay.bandwidthBurst} KBytes`)
    lines.push('ExitRelay 0')
    lines.push('')
  }

  return lines.join('\n')
}

const kbytes = (n: string, unit: string) =>
  parseInt(n, 10) * (unit === 'M' ? 1024 : 1)

/**
 * Parses a torrc file back into structured config.
 * Uses a state machine to group HiddenServiceDir/HiddenServicePort blocks,
 * reading `# @service`, `# @ssl`, and `# @internalPort` annotations to
 * recover metadata.
 * Bandwidth values are stored in KBytes; a torrc written by an earlier
 * release carries MBytes.
 */
function fromFile(raw: string): unknown {
  const res: z.infer<typeof shape> = {
    onionServices: {},
    relay: {
      enabled: false,
      bridge: false,
      orPort: 9001,
      bandwidthRate: 1024,
      bandwidthBurst: 2048,
    },
    advertise: { orPort: null, address: null, port: null, ipv4Only: false },
  }

  const lines = raw.split('\n')
  let currentPackageId: string | null = null
  let currentHostId: string | null = null
  let currentIndex: string | null = null
  let currentPorts: Record<
    string,
    { target: string; ssl: boolean; internalPort: number }
  > = {}
  let nextSslInternalPort: number | null = null
  let nextInternalPort: number | null = null
  let listens = false

  function flushCurrent() {
    if (
      currentPackageId &&
      currentHostId &&
      currentIndex &&
      Object.keys(currentPorts).length > 0
    ) {
      if (!res.onionServices[currentPackageId])
        res.onionServices[currentPackageId] = {}
      if (!res.onionServices[currentPackageId]![currentHostId])
        res.onionServices[currentPackageId]![currentHostId] = {}
      res.onionServices[currentPackageId]![currentHostId]![currentIndex] = {
        ports: currentPorts,
      }
    }
    currentPackageId = null
    currentHostId = null
    currentIndex = null
    currentPorts = {}
    nextSslInternalPort = null
    nextInternalPort = null
  }

  for (const line of lines) {
    const trimmed = line.trim()

    const serviceMatch = trimmed.match(/^# @service (\S+) (\S+)$/)
    if (serviceMatch) {
      flushCurrent()
      currentPackageId = serviceMatch[1]
      currentHostId = serviceMatch[2]
      continue
    }

    const sslMatch = trimmed.match(/^# @ssl (\d+)$/)
    if (sslMatch) {
      nextSslInternalPort = parseInt(sslMatch[1], 10)
      continue
    }

    const internalPortMatch = trimmed.match(/^# @internalPort (\d+)$/)
    if (internalPortMatch) {
      nextInternalPort = parseInt(internalPortMatch[1], 10)
      continue
    }

    const hsDirMatch = trimmed.match(/\/hs_([^/]+)\/?$/)
    if (trimmed.startsWith('HiddenServiceDir') && hsDirMatch) {
      currentIndex = hsDirMatch[1]
      continue
    }

    const portMatch = trimmed.match(/^HiddenServicePort (\d+)\s+(\S+)/)
    if (portMatch && currentPackageId) {
      const target = portMatch[2]
      if (nextSslInternalPort !== null) {
        currentPorts[portMatch[1]] = {
          target,
          ssl: true,
          internalPort: nextSslInternalPort,
        }
        nextSslInternalPort = null
      } else {
        // Prefer the `# @internalPort` annotation; fall back to the target
        // port for legacy entries written before the annotation existed
        // (where it equals the lxcbr0 NAT port, not the upstream internal
        // port, for SSL-wrapped/port-shifted bindings).
        const colonIdx = target.lastIndexOf(':')
        const internalPort =
          nextInternalPort ?? parseInt(target.slice(colonIdx + 1), 10)
        currentPorts[portMatch[1]] = { target, ssl: false, internalPort }
        nextInternalPort = null
      }
      continue
    }

    let m
    if ((m = trimmed.match(/^ORPort (\d+)(.*)/))) {
      flushCurrent()
      res.relay.enabled = true
      const flags = m[2].split(/\s+/)
      // A NoListen line carries the advertised port; the port Tor listens on
      // is written without it.
      if (flags.includes('NoListen')) res.advertise.port = parseInt(m[1], 10)
      else {
        res.relay.orPort = parseInt(m[1], 10)
        listens = true
      }
      if (flags.includes('IPv4Only')) res.advertise.ipv4Only = true
    } else if ((m = trimmed.match(/^Address (\S+)/))) {
      res.advertise.address = m[1]
    } else if ((m = trimmed.match(/^Nickname (.+)/))) {
      res.relay.nickname = m[1]
    } else if ((m = trimmed.match(/^ContactInfo (.+)/))) {
      res.relay.contactInfo = m[1]
    } else if (trimmed === 'BridgeRelay 1') {
      res.relay.bridge = true
    } else if ((m = trimmed.match(/^RelayBandwidthRate (\d+) ([KM])Bytes/))) {
      res.relay.bandwidthRate = kbytes(m[1], m[2])
    } else if ((m = trimmed.match(/^RelayBandwidthBurst (\d+) ([KM])Bytes/))) {
      res.relay.bandwidthBurst = kbytes(m[1], m[2])
    }
  }

  flushCurrent()
  // A NoListen line that lost its listening partner still names the relay's port.
  if (res.advertise.port !== null && !listens) {
    res.relay.orPort = res.advertise.port
    res.advertise.port = null
  }
  if (
    res.advertise.address !== null ||
    res.advertise.port !== null ||
    res.advertise.ipv4Only
  ) {
    res.advertise.orPort = res.relay.orPort
  }

  return res
}

export const torrc = FileHelper.raw(
  { base: sdk.volumes.tor, subpath: '/torrc' },
  toFile,
  fromFile,
  (data) => shape.parse(data),
)
