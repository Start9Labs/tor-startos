import { connect } from 'node:net'
import { sdk } from '../sdk'

/**
 * Runs a batch of commands against Tor's control socket and returns the raw
 * reply. No password is needed — the Unix socket is protected by file
 * permissions (700). Resolves to null whenever the socket can't be reached or
 * doesn't answer in time, so "Tor isn't listening" is a value callers handle
 * rather than an exception.
 */
function send(...commands: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const socket = connect(sdk.volumes.tor.subpath('control.sock'))
    let data = ''

    socket.setTimeout(5000)
    socket.on('connect', () => {
      socket.write(['AUTHENTICATE', ...commands, 'QUIT', ''].join('\r\n'))
    })
    socket.on('data', (chunk) => {
      data += chunk.toString()
    })
    socket.on('end', () => resolve(data))
    socket.on('error', () => resolve(null))
    socket.on('timeout', () => {
      socket.destroy()
      resolve(null)
    })
  })
}

export type TorStatus = {
  /** Bootstrap percentage and the summary line Tor pairs with it. */
  bootstrap: { progress: number; summary: string } | null
  /** False only when Tor explicitly reports having no usable circuit. */
  circuitEstablished: boolean
  /** Whether Tor has gone idle for lack of use — not building circuits by design. */
  dormant: boolean
}

export type RelayStatus = {
  /**
   * Tor's self-test found every ORPort in its current descriptor reachable.
   * Vacuously true while Tor has no descriptor yet, so read it with `published`.
   */
  reachable: boolean
  /** A directory authority accepted the descriptor Tor last uploaded. */
  published: boolean
  /** Tor knows an IPv6 address to publish, so an IPv6 ORPort is in play. */
  ipv6: boolean
}

/** The watchdog probes every 30 seconds at its slowest; older than this is no reading. */
const RELAY_STATUS_MAX_AGE_MS = 90_000

let relay: { at: number; status: RelayStatus } | null = null

/**
 * Everything the health check needs, in one round trip. Returns null when Tor
 * isn't answering its control socket at all.
 */
export async function probe(): Promise<TorStatus | null> {
  const reply = await send(
    'GETINFO status/bootstrap-phase',
    'GETINFO status/circuit-established',
    'GETINFO dormant',
    // For relayStatus(). Tor logs a notice for every control connection, so
    // the relay check reads this reply instead of opening a second one.
    'GETINFO status/reachability-succeeded/or',
    'GETINFO status/accepted-server-descriptor',
    'GETINFO address/v6',
  )
  if (reply === null) {
    relay = null
    return null
  }
  relay = {
    at: Date.now(),
    status: {
      reachable: /status\/reachability-succeeded\/or=1/.test(reply),
      published: /status\/accepted-server-descriptor=1/.test(reply),
      ipv6: /address\/v6=\S/.test(reply),
    },
  }

  const phase = reply.match(/BOOTSTRAP PROGRESS=(\d+).*?SUMMARY="([^"]*)"/)
  const dormant = reply.match(/[- ]dormant=(\d+)/)

  return {
    bootstrap: phase
      ? { progress: parseInt(phase[1], 10), summary: phase[2] }
      : null,
    // Only an explicit zero counts as "no circuit". Absent the key entirely,
    // assume Tor can build circuits rather than let the watchdog escalate on a
    // reading it never got.
    circuitEstablished: !/status\/circuit-established=0/.test(reply),
    dormant: !!dormant && parseInt(dormant[1], 10) !== 0,
  }
}

/**
 * Discards the guards Tor has pinned, the circuit-build-timeout estimates a
 * failing guard skews, and every open circuit, so Tor re-selects guards without
 * a restart. Returns false when Tor isn't answering.
 */
export async function resetCircuits(): Promise<boolean> {
  return (await send('DROPGUARDS', 'DROPTIMEOUTS', 'SIGNAL NEWNYM')) !== null
}

/**
 * What Tor's self-test says about the relay's OR port, the test that gates
 * publishing the relay descriptor, as of the watchdog's latest `probe()`. Null
 * when Tor didn't answer that probe, or there hasn't been one lately.
 */
export function relayStatus(): RelayStatus | null {
  if (!relay || Date.now() - relay.at > RELAY_STATUS_MAX_AGE_MS) return null
  return relay.status
}

/** Signals Tor to re-read torrc in place, avoiding a full daemon restart. */
export async function reloadConfig(): Promise<void> {
  await send('SIGNAL RELOAD')
}
