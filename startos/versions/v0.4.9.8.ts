import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_4_9_8 = VersionInfo.of({
  version: '0.4.9.8:1',
  releaseNotes: {
    en_US: `**Bumps**

- Tor → 0.4.9.8 (via Alpine 3.23)
- start-sdk → 1.5.1`,
    es_ES: `**Actualizaciones**

- Tor → 0.4.9.8 (vía Alpine 3.23)
- start-sdk → 1.5.1`,
    de_DE: `**Aktualisierungen**

- Tor → 0.4.9.8 (über Alpine 3.23)
- start-sdk → 1.5.1`,
    pl_PL: `**Aktualizacje**

- Tor → 0.4.9.8 (przez Alpine 3.23)
- start-sdk → 1.5.1`,
    fr_FR: `**Mises à jour**

- Tor → 0.4.9.8 (via Alpine 3.23)
- start-sdk → 1.5.1`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
