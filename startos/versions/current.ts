import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.12:1',
  releaseNotes: {
    en_US: `Relay bandwidth rate and burst are set in KB/s, down to Tor's 75 KB/s relay minimum. Existing settings carry over unchanged.`,
    es_ES: `La tasa y la ráfaga de ancho de banda del relé se configuran en KB/s, hasta el mínimo de 75 KB/s que Tor exige a un relé. Los ajustes existentes se conservan sin cambios.`,
    de_DE: `Bandbreitenrate und Bandbreitenstoß des Relays werden in KB/s festgelegt, bis hinunter zu Tors Relay-Minimum von 75 KB/s. Bestehende Einstellungen werden unverändert übernommen.`,
    pl_PL: `Szybkość i skok przepustowości przekaźnika ustawia się w KB/s, aż do wymaganego przez Tor minimum 75 KB/s dla przekaźnika. Istniejące ustawienia są zachowane bez zmian.`,
    fr_FR: `Le débit et la rafale de bande passante du relais se règlent en Ko/s, jusqu'au minimum de 75 Ko/s que Tor impose à un relais. Les réglages existants sont conservés tels quels.`,
  },
  migrations: {},
})
