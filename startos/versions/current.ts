import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.13:0',
  releaseNotes: {
    en_US: `Updated Tor to 0.4.9.13. [Full upstream release notes](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.13).`,
    es_ES: `Tor actualizado a 0.4.9.13. [Notas completas de la versión original](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.13).`,
    de_DE: `Tor auf 0.4.9.13 aktualisiert. [Vollständige Versionshinweise des Originalprojekts](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.13).`,
    pl_PL: `Zaktualizowano Tor do wersji 0.4.9.13. [Pełne informacje o wydaniu projektu źródłowego](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.13).`,
    fr_FR: `Tor mis à jour vers la version 0.4.9.13. [Notes de version complètes du projet d'origine](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.13).`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
