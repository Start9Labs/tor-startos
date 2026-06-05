import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.9:1',
  releaseNotes: {
    en_US: 'Bumps Tor → 0.4.9.9 (upstream security release).',
    es_ES: 'Actualiza Tor → 0.4.9.9 (versión de seguridad oficial).',
    de_DE: 'Aktualisiert Tor → 0.4.9.9 (Upstream-Sicherheitsrelease).',
    pl_PL: 'Aktualizuje Tor → 0.4.9.9 (wydanie zabezpieczające od twórców).',
    fr_FR: 'Met à jour Tor → 0.4.9.9 (version de sécurité officielle).',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
