import { i18n } from './i18n'
import { applyPendingWipe, watchdog } from './utils/recovery'
import { sdk } from './sdk'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info('Starting Tor!')

  // Before any daemon exists, so a queued wipe can't be undone by a running Tor
  // flushing its in-memory state back to disk.
  const wipes = await applyPendingWipe(effects)

  const torSub = sdk.SubContainer.of(
    effects,
    { imageId: 'tor' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'tor',
      subpath: null,
      mountpoint: '/var/lib/tor',
      readonly: false,
    }),
    'tor-sub',
  )

  return (
    sdk.Daemons.of(effects)
      // Fix ownership before the daemon starts — the volume is created as root
      // but Tor runs as the 'tor' user and requires 700 permissions on its data dir
      .addOneshot('chown', {
        subcontainer: torSub,
        exec: {
          command: [
            'sh',
            '-c',
            'chmod -R 700 /var/lib/tor && chown -R tor:tor /var/lib/tor',
          ],
          user: 'root',
        },
        requires: [],
      })
      .addDaemon('tor', {
        subcontainer: torSub,
        exec: {
          // Read torrc directly from the volume instead of the default /etc/tor/torrc
          command: ['tor', '-f', '/var/lib/tor/torrc'],
        },
        ready: {
          display: i18n('Tor SOCKS Proxy'),
          fn: watchdog(effects, wipes),
          // Poll every 1s while bootstrapping. defaultTrigger polls 'loading'
          // only every 30s, so the first "Bootstrapping: 0%" reading stuck for
          // 30s while Tor actually finished — the UI showed 0% long after Tor
          // was done. Tor bootstraps in seconds, so we want frequent updates
          // until it reports success (then back off to the 30s default).
          trigger: sdk.trigger.statusTrigger(30_000, {
            starting: 1_000,
            waiting: 1_000,
            failure: 1_000,
            loading: 1_000,
          }),
        },
        requires: ['chown'],
      })
  )
})
