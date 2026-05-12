import { setupManifest } from '@start9labs/start-sdk'
import i18n from './i18n'

export const manifest = setupManifest({
  id: 'tor',
  title: 'Tor',
  license: 'BSD-3-Clause',
  packageRepo: 'https://github.com/Start9Labs/tor-startos',
  upstreamRepo: 'https://gitlab.torproject.org/tpo/core/tor/',
  marketingUrl: 'https://www.torproject.org/',
  donationUrl: 'https://donate.torproject.org/',
  description: i18n.description,
  volumes: ['tor', 'startos'],
  images: {
    tor: {
      source: { dockerBuild: {} },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
  },
  alerts: {
    uninstall: i18n.alertUninstall,
  },
  dependencies: {},
  plugins: ['url-v0'],
})
