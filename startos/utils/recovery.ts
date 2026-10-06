import { access, rm, writeFile } from 'node:fs/promises'
import { T } from '@start9labs/start-sdk'
import type { HealthCheckResult } from '@start9labs/start-sdk/lib/health/checkFns'
import { storeJson } from '../fileModels/store.json'
import { probe, resetCircuits } from './control'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Flag files, present = set: create and unlink are atomic, so no write can tear or race.
const flag = (name: string) => {
  const path = sdk.volumes.tor.subpath(name)
  return {
    name,
    isSet: () =>
      access(path).then(
        () => true,
        () => false,
      ),
    set: () => writeFile(path, ''),
    clear: () => rm(path, { force: true }),
  }
}

/** A wipe is queued for the next start, where no tor process holds the volume. */
export const wipeRequested = flag('.wipe-requested')
/** The watchdog already wiped during this outage; it does not wipe twice. */
export const autoWiped = flag('.auto-wiped')

/** Tor must be unhealthy this long before the watchdog does anything at all. */
const STALL_MS = 5 * 60_000

/**
 * Waits after each attempt at dropping entry nodes. The length is also the
 * number of attempts, after which the watchdog escalates to a wipe.
 */
const RETRY_MS = [10, 20].map((m) => m * 60_000)

/**
 * Tor's DataDirectory, which holds nothing but its cached view of the network:
 * the `state` file that pins its entry nodes, and the consensus and descriptor
 * caches. The torrc, the onion keys and the flags live beside it, not in it.
 */
const DATA_DIR = 'data'

/**
 * Must run with no tor process attached to the volume. A running Tor holds this
 * state in memory and flushes it on shutdown, so deleting the files underneath
 * it writes the same entry nodes straight back.
 */
const wipeNetworkState = () =>
  rm(sdk.volumes.tor.subpath(DATA_DIR), { recursive: true, force: true })

/**
 * Performs a wipe left pending by the watchdog or the Reset Tor Connection
 * action, and reports whether the watchdog already wiped during this outage.
 *
 * Call this from `main` before constructing any daemon — the only point in the
 * lifecycle where the volume is guaranteed to have no tor process on it. The
 * pending flag is cleared only once the wipe succeeds, so a failure part-way
 * through retries on the next start rather than leaving Tor half-wiped.
 */
export async function applyPendingWipe(): Promise<boolean> {
  if (await wipeRequested.isSet()) {
    await wipeNetworkState()
    console.info('Wiped Tor network state')
    await wipeRequested.clear()
  }
  return autoWiped.isSet()
}

/** Queues a wipe for the next start. The caller restarts the service. */
export function requestWipe() {
  return wipeRequested.set()
}

/**
 * The daemon's readiness probe, which also recovers Tor when it wedges.
 *
 * Tor pins an entry node and keeps retrying it — deliberately, to resist
 * guard-discovery attacks — so an entry node that goes bad leaves Tor stuck
 * bootstrapping or unable to sustain circuits, and a plain restart doesn't help
 * because the choice is persisted. Sustained unhealthiness therefore escalates:
 * first drop the entry nodes over the control socket, then wipe the cached
 * network state and restart so Tor re-selects from scratch.
 *
 * It wipes at most once per outage. If Tor is still broken afterwards the cause
 * isn't stale state — most likely the box has no working internet — so the
 * watchdog stops and leaves the health check reporting the failure.
 */
export function watchdog(effects: T.Effects, wiped: boolean) {
  let unhealthySince: number | null = null
  let lastProgress: number | null = null
  let attempts = 0
  let nextAttemptAt = 0
  let exhausted = false

  const check = async (): Promise<HealthCheckResult> => {
    const now = Date.now()
    const status = await probe()

    // Dormant counts as healthy: Tor drops circuits when nothing has asked it
    // for one in a long while, and wakes on the next request.
    if (
      status?.bootstrap &&
      status.bootstrap.progress >= 100 &&
      (status.circuitEstablished || status.dormant)
    ) {
      unhealthySince = null
      attempts = 0
      exhausted = false
      if (wiped) {
        await autoWiped.clear()
        wiped = false
      }
      return { result: 'success', message: i18n('Tor is running') }
    }

    const bootstrap = status?.bootstrap ?? null

    // Any movement in the bootstrap percentage restarts the stall clock, so a
    // slow first start isn't mistaken for a wedge. The attempt ladder is not
    // reset — only a healthy reading does that.
    const progress = bootstrap?.progress ?? null
    if (
      unhealthySince === null ||
      (progress !== null && progress !== lastProgress)
    ) {
      unhealthySince = now
      nextAttemptAt = now + STALL_MS
    }
    lastProgress = progress

    // Off is fail closed: nothing about Tor's connection changes by itself.
    const automatic =
      (await storeJson.read((s) => s.automaticRecovery).once()) ?? true

    if (automatic && now >= nextAttemptAt) {
      // Dropping entry nodes only means anything while Tor is answering. When
      // it isn't, skip straight to the wipe: a control socket unreachable this
      // long usually means Tor can't get through its own start-up state.
      if (attempts < RETRY_MS.length && (await resetCircuits())) {
        console.warn(
          `Tor unhealthy since ${new Date(unhealthySince).toISOString()} — dropped entry nodes and circuits (attempt ${attempts + 1}/${RETRY_MS.length})`,
        )
        nextAttemptAt = now + RETRY_MS[attempts]
        attempts += 1
      } else if (!wiped) {
        console.warn(
          'Dropping entry nodes did not recover Tor — wiping cached network state and restarting',
        )
        wiped = true
        // Holds off while the service tears down, and retries if the restart
        // never lands.
        nextAttemptAt = now + STALL_MS
        // Request first: a crash between the two costs one extra wipe, not a
        // skipped one.
        await wipeRequested.set()
        await autoWiped.set()
        await sdk.restart(effects)
      } else {
        // Already wiped this outage and Tor is still broken, so the cause isn't
        // stale state. Stop until a healthy reading resets the clock, and say so
        // through the health check.
        console.warn(
          'Tor is still unhealthy after a network state wipe — not retrying; check the connection to the internet',
        )
        exhausted = true
        nextAttemptAt = Infinity
      }
    }

    if (exhausted)
      return {
        result: 'failure',
        message: i18n(
          'Tor reset its connection but still cannot connect. Check the server’s internet connection.',
        ),
      }
    if (!bootstrap)
      return { result: 'failure', message: i18n('Tor is not ready') }
    if (bootstrap.progress >= 100)
      return {
        result: 'failure',
        message: automatic
          ? i18n('Tor is bootstrapped but cannot build circuits')
          : i18n(
              'Tor cannot build circuits. Automatic Recovery is off, so run Reset Tor Connection if this does not clear.',
            ),
      }
    return {
      result: 'loading',
      message: `Bootstrapping: ${bootstrap.progress}% - ${bootstrap.summary}`,
    }
  }

  return async (): Promise<HealthCheckResult> => {
    try {
      return await check()
    } catch (e) {
      // The SDK turns a thrown error into a failure reading carrying the error's
      // own text, which then shows as the health message. Log it and report the
      // standard failure instead.
      console.error(`Tor health check failed: ${String(e)}`)
      return { result: 'failure', message: i18n('Tor is not ready') }
    }
  }
}
