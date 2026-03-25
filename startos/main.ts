import type { HealthCheckResult } from '@start9labs/start-sdk/package/lib/health/checkFns'
import { connect } from 'node:net'
import { i18n } from './i18n'
import { sdk } from './sdk'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info('Starting Tor!')

  const torSub = await sdk.SubContainer.of(
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
          fn: checkBootstrap,
        },
        requires: ['chown'],
      })
  )
})

/**
 * Queries Tor's control socket for bootstrap progress.
 * No password is needed — the Unix socket is protected by file permissions (700).
 */
function checkBootstrap(): Promise<HealthCheckResult> {
  return new Promise((resolve) => {
    const socket = connect(sdk.volumes.tor.subpath('control.sock'))
    let data = ''

    socket.setTimeout(5000)
    socket.on('connect', () => {
      socket.write('AUTHENTICATE\r\nGETINFO status/bootstrap-phase\r\nQUIT\r\n')
    })
    socket.on('data', (chunk) => {
      data += chunk.toString()
    })
    socket.on('end', () => {
      const match = data.match(/BOOTSTRAP PROGRESS=(\d+).*?SUMMARY="([^"]*)"/)
      if (!match) {
        resolve({ result: 'failure', message: i18n('Tor is not ready') })
        return
      }
      const progress = parseInt(match[1], 10)
      const summary = match[2]
      if (progress >= 100) {
        resolve({ result: 'success', message: i18n('Tor is running') })
      } else {
        resolve({
          result: 'loading',
          message: `Bootstrapping: ${progress}% - ${summary}`,
        })
      }
    })
    socket.on('error', () => {
      resolve({ result: 'failure', message: i18n('Tor is not ready') })
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve({ result: 'failure', message: i18n('Tor is not ready') })
    })
  })
}
