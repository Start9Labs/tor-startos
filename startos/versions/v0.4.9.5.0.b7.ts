import { VersionInfo } from '@start9labs/start-sdk'

export const v_0_4_9_5_0_b7 = VersionInfo.of({
  version: '0.4.9.5:0-beta.7',
  releaseNotes: {
    en_US: 'Fix bug where deleting an onion service could wipe the entire torrc configuration',
    es_ES: 'Corrección de error donde eliminar un servicio onion podía borrar toda la configuración de torrc',
    de_DE: 'Fehlerbehebung, bei der das Löschen eines Onion-Dienstes die gesamte torrc-Konfiguration löschen konnte',
    pl_PL: 'Naprawiono błąd, w którym usunięcie usługi onion mogło wyczyścić całą konfigurację torrc',
    fr_FR: "Correction d'un bug où la suppression d'un service onion pouvait effacer toute la configuration torrc",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
