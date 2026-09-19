import type { HealthCheckResult } from '@start9labs/start-sdk/lib/health/checkFns'
import type { Effects } from '@start9labs/start-sdk/lib/types'
import { torrc } from '../fileModels/torrc'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { relayStatus } from './control'

/**
 * How long Tor waits after starting before it warns that the OR port is
 * unreachable (`TIMEOUT_UNTIL_UNREACHABILITY_COMPLAINT` in tor's `or.h`). It
 * repeats that check every 20 minutes afterwards.
 */
const SELF_TEST_MS = 20 * 60_000

/**
 * With an auto-discovered IPv6 address, Tor keeps reporting the OR port
 * unreachable until one of those 20-minute checks, run after IPv4 is confirmed,
 * drops the unreachable IPv6 address and publishes over IPv4 alone
 * (`reachability_warnings_callback` in tor's `relay_periodic.c`). This allows
 * two of those checks.
 */
const SELF_TEST_WITH_IPV6_MS = 45 * 60_000

/**
 * The Relay Reachability health check: Tor's own verdict on whether the OR port
 * is reachable from the internet, which otherwise shows only in the logs.
 *
 * Success needs a directory authority to have accepted the descriptor as well,
 * because Tor's reachability flag is vacuously true until it has built one.
 * Short of that it reports `loading`, not `failure`, until Tor has had as long
 * as it gives itself. The clock starts at the first unreachable reading and
 * starts over whenever the OR port or the advertised address changes, since
 * Tor tests again from scratch.
 *
 * Tor never revisits a passed test until its address changes, so its verdict
 * outlives the inbound path. With no public address enabled on the OR port
 * there is no inbound path at all, and the check says so whatever Tor reports.
 */
export function relayReachability(effects: Effects) {
  let unreachableSince: number | null = null
  let testedConfig: string | null = null

  return async (): Promise<HealthCheckResult> => {
    const config = await torrc
      .read((t) => ({
        enabled: t.relay.enabled,
        orPort: t.relay.orPort,
        advertise: t.advertise,
      }))
      .once()
    if (!config?.enabled) {
      unreachableSince = null
      testedConfig = null
      return { result: 'disabled', message: i18n('Relay mode is off') }
    }

    const exposed = await sdk.host
      .getOwn(
        effects,
        'or-multi',
        (host) =>
          (host?.bindings[config.orPort]?.interfaces['or']?.addressInfo.public
            .hostnames.length ?? 0) > 0,
      )
      .once()
    if (!exposed) {
      unreachableSince = null
      return {
        result: 'failure',
        message: i18n(
          'Not reachable from the internet. Enable the Public address on the Tor Relay OR Port interface.',
        ),
      }
    }

    const key = JSON.stringify(config)
    if (key !== testedConfig) {
      testedConfig = key
      unreachableSince = null
    }

    const status = await relayStatus()
    if (!status) {
      return { result: 'loading', message: i18n('Tor is not ready') }
    }
    if (status.reachable && status.published) {
      unreachableSince = null
      return { result: 'success', message: i18n('Reachable from the internet') }
    }

    const now = Date.now()
    unreachableSince ??= now
    const allowance = status.ipv6 ? SELF_TEST_WITH_IPV6_MS : SELF_TEST_MS
    if (now - unreachableSince < allowance) {
      return {
        result: 'loading',
        message: i18n(
          'Testing whether the relay is reachable from the internet',
        ),
      }
    }
    return {
      result: 'failure',
      message: i18n(
        'Tor could not reach the relay from the internet. Check that the OR port is forwarded to this server, and that the Public address is enabled on only one connection.',
      ),
    }
  }
}
