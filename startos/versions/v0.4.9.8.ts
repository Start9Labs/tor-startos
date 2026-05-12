import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_4_9_8 = VersionInfo.of({
  version: '0.4.9.8:0',
  releaseNotes: {
    en_US: `**Bumps**

- Tor → 0.4.9.8 (includes security fixes from 0.4.9.6 and 0.4.9.7)
- start-sdk → 1.5.0`,
    es_ES: `**Actualizaciones**

- Tor → 0.4.9.8 (incluye correcciones de seguridad de 0.4.9.6 y 0.4.9.7)
- start-sdk → 1.5.0`,
    de_DE: `**Aktualisierungen**

- Tor → 0.4.9.8 (enthält Sicherheitskorrekturen aus 0.4.9.6 und 0.4.9.7)
- start-sdk → 1.5.0`,
    pl_PL: `**Aktualizacje**

- Tor → 0.4.9.8 (zawiera poprawki bezpieczeństwa z 0.4.9.6 i 0.4.9.7)
- start-sdk → 1.5.0`,
    fr_FR: `**Mises à jour**

- Tor → 0.4.9.8 (inclut les correctifs de sécurité de 0.4.9.6 et 0.4.9.7)
- start-sdk → 1.5.0`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
