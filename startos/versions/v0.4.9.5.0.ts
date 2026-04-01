import { VersionInfo } from '@start9labs/start-sdk'

export const v_0_4_9_5_0 = VersionInfo.of({
  version: '0.4.9.5:0',
  releaseNotes: {
    en_US: 'Fix bug where cleaning up a stale onion service entry could wipe all onion services',
    es_ES: 'Corrección de error donde la limpieza de una entrada de servicio onion obsoleta podía borrar todos los servicios onion',
    de_DE: 'Fehlerbehebung, bei der das Bereinigen eines veralteten Onion-Dienst-Eintrags alle Onion-Dienste löschen konnte',
    pl_PL: 'Naprawiono błąd, w którym czyszczenie nieaktualnego wpisu usługi onion mogło usunąć wszystkie usługi onion',
    fr_FR: "Correction d'un bug où le nettoyage d'une entrée de service onion obsolète pouvait supprimer tous les services onion",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
