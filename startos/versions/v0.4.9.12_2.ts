import { readFile, rm } from 'node:fs/promises'
import { VersionInfo, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { autoWiped, wipeRequested } from '../utils/recovery'

const legacyWatchdogShape = z.object({
  wipeRequested: z.boolean().catch(false),
  autoWiped: z.boolean().catch(false),
})

export const v_0_4_9_12_2 = VersionInfo.of({
  version: '0.4.9.12:2',
  releaseNotes: {
    en_US: `- \`start-cli package attach tor\` now opens a shell in the Tor container.
- Tor starts after a power cut during its automatic recovery, and Reset Tor Connection takes effect even when run right after one.`,
    es_ES: `- \`start-cli package attach tor\` ahora abre un shell en el contenedor de Tor.
- Tor arranca tras un corte de energía durante su recuperación automática, y Restablecer la conexión de Tor surte efecto incluso si se ejecuta justo después de una.`,
    de_DE: `- \`start-cli package attach tor\` öffnet jetzt eine Shell im Tor-Container.
- Tor startet nach einem Stromausfall während seiner automatischen Wiederherstellung, und „Tor-Verbindung zurücksetzen“ wirkt auch direkt nach einer solchen.`,
    pl_PL: `- \`start-cli package attach tor\` otwiera teraz powłokę w kontenerze Tora.
- Tor uruchamia się po utracie zasilania w trakcie automatycznego odzyskiwania, a Zresetuj połączenie Tor działa nawet uruchomione tuż po nim.`,
    fr_FR: `- \`start-cli package attach tor\` ouvre désormais un shell dans le conteneur Tor.
- Tor démarre après une coupure de courant survenue pendant sa récupération automatique, et Réinitialiser la connexion Tor prend effet même lancé juste après l'une d'elles.`,
  },
  migrations: {
    up: async () => {
      const legacy = sdk.volumes.tor.subpath('.watchdog.json')
      const state = await readFile(legacy, 'utf8')
        .then((raw) => legacyWatchdogShape.parse(JSON.parse(raw)))
        .catch(() => ({ wipeRequested: false, autoWiped: false }))
      if (state.wipeRequested) await wipeRequested.set()
      if (state.autoWiped) await autoWiped.set()
      await rm(legacy, { force: true })
    },
  },
})
