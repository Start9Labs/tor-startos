import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.14:0',
  releaseNotes: {
    en_US:
      'Updated Tor to 0.4.9.14, a security release fixing high-severity issues affecting clients and onion services. Also fixes circuit recovery and onion-service connection handling. [Full upstream release notes](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.14/ChangeLog).',
    es_ES:
      'Tor actualizado a 0.4.9.14, una versión de seguridad que corrige problemas de alta gravedad que afectan a clientes y servicios onion. También corrige la recuperación de circuitos y la gestión de conexiones de los servicios onion. [Notas completas de la versión original](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.14/ChangeLog).',
    de_DE:
      'Tor auf 0.4.9.14 aktualisiert, ein Sicherheitsupdate zur Behebung schwerwiegender Probleme bei Clients und Onion-Diensten. Außerdem werden die Wiederherstellung von Circuits und die Verbindungsverwaltung von Onion-Diensten korrigiert. [Vollständige Versionshinweise des Originalprojekts](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.14/ChangeLog).',
    pl_PL:
      'Zaktualizowano Tor do wersji 0.4.9.14, wydania bezpieczeństwa naprawiającego poważne problemy dotyczące klientów i usług onion. Naprawiono także odzyskiwanie obwodów i obsługę połączeń usług onion. [Pełne informacje o wydaniu projektu źródłowego](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.14/ChangeLog).',
    fr_FR:
      "Tor mis à jour vers la version 0.4.9.14, une version de sécurité corrigeant des problèmes de gravité élevée touchant les clients et les services onion. Corrige également la récupération des circuits et la gestion des connexions des services onion. [Notes de version complètes du projet d'origine](https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.14/ChangeLog).",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
