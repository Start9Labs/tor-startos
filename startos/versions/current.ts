import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.14:0',
  releaseNotes: {
    en_US: `Updated Tor to 0.4.9.14, a security release. [Full upstream release notes](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.14).`,
    es_ES: `Tor actualizado a 0.4.9.14, una versión de seguridad. [Notas completas de la versión original](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.14).`,
    de_DE: `Tor auf 0.4.9.14 aktualisiert, ein Sicherheitsupdate. [Vollständige Versionshinweise des Originalprojekts](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.14).`,
    pl_PL: `Zaktualizowano Tor do wersji 0.4.9.14, wydania bezpieczeństwa. [Pełne informacje o wydaniu projektu źródłowego](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.14).`,
    fr_FR: `Tor mis à jour vers la version 0.4.9.14, une version de sécurité. [Notes de version complètes du projet d'origine](https://gitlab.torproject.org/tpo/core/tor/-/tags/tor-0.4.9.14).`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
