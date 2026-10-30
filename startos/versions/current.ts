import { existsSync } from 'node:fs'
import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { importedMigrationPath } from '../init/migrateOnionAddresses'
import { reportUnusedAddresses } from '../utils/onions'

export const current = VersionInfo.of({
  version: '0.4.9.15:0',
  releaseNotes: {
    en_US:
      'Updated Tor to 0.4.9.15, a security release. [Full upstream release notes](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.15/ChangeLog). On a server updated from StartOS 0.3.5, a notification lists the .onion addresses that no interface uses, and how to publish one again.',
    es_ES:
      'Tor actualizado a 0.4.9.15, una versión de seguridad. [Notas completas de la versión original](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.15/ChangeLog). En un servidor actualizado desde StartOS 0.3.5, una notificación enumera las direcciones .onion que ninguna interfaz usa y cómo volver a publicar una.',
    de_DE:
      'Tor auf 0.4.9.15 aktualisiert, ein Sicherheitsupdate. [Vollständige Versionshinweise des Originalprojekts](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.15/ChangeLog). Auf einem von StartOS 0.3.5 aktualisierten Server listet eine Benachrichtigung die .onion-Adressen auf, die keine Schnittstelle nutzt, und erklärt, wie Sie eine wieder veröffentlichen.',
    pl_PL:
      'Zaktualizowano Tor do wersji 0.4.9.15, wydania bezpieczeństwa. [Pełne informacje o wydaniu projektu źródłowego](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.15/ChangeLog). Na serwerze zaktualizowanym ze StartOS 0.3.5 powiadomienie wymienia adresy .onion, których nie używa żaden interfejs, i wyjaśnia, jak ponownie opublikować adres.',
    fr_FR:
      "Tor mis à jour vers la version 0.4.9.15, une version de sécurité. [Notes de version complètes du projet d'origine](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.15/ChangeLog). Sur un serveur mis à jour depuis StartOS 0.3.5, une notification liste les adresses .onion qu'aucune interface n'utilise, et explique comment en publier une à nouveau.",
  },
  migrations: {
    up: async ({ effects }) => {
      if (existsSync(importedMigrationPath))
        await reportUnusedAddresses(effects)
    },
    down: IMPOSSIBLE,
  },
})
