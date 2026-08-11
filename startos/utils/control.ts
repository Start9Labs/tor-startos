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

/**
 * Everything the health check needs, in one round trip. Returns null when Tor
 * isn't answering its control socket at all.
 */
export async function probe(): Promise<TorStatus | null> {
  const reply = await send(
    'GETINFO status/bootstrap-phase',
    'GETINFO status/circuit-established',
    'GETINFO dormant',
  )
  if (reply === null) return null

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

/** Signals Tor to re-read torrc in place, avoiding a full daemon restart. */
export async function reloadConfig(): Promise<void> {
  await send('SIGNAL RELOAD')
}
