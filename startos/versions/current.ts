import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.12:0',
  releaseNotes: {
    en_US:
      'Updated Tor to 0.4.9.12. This urgent security release fixes multiple use-after-free and memory denial-of-service vulnerabilities, tightens DNS validation, and corrects congestion control and stream isolation. Relay operators should update promptly because directory authorities no longer accept descriptors with obsolete TAP keys. [Full upstream release notes](https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.12/ReleaseNotes)',
    es_ES:
      'Tor se ha actualizado a la versión 0.4.9.12. Esta versión de seguridad urgente corrige varias vulnerabilidades de uso de memoria después de liberarla y de denegación de servicio por agotamiento de memoria, refuerza la validación de DNS y corrige el control de congestión y el aislamiento de flujos. Los operadores de repetidores deben actualizar cuanto antes porque las autoridades de directorio ya no aceptan descriptores con claves TAP obsoletas. [Notas completas de la versión upstream](https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.12/ReleaseNotes)',
    de_DE:
      'Tor wurde auf Version 0.4.9.12 aktualisiert. Dieses dringende Sicherheitsupdate behebt mehrere Use-after-Free- und speicherbasierte Denial-of-Service-Schwachstellen, verschärft die DNS-Validierung und korrigiert die Überlastungssteuerung sowie die Stream-Isolierung. Relay-Betreiber sollten zeitnah aktualisieren, da Verzeichnisautoritäten keine Deskriptoren mit veralteten TAP-Schlüsseln mehr akzeptieren. [Vollständige Upstream-Versionshinweise](https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.12/ReleaseNotes)',
    pl_PL:
      'Zaktualizowano Tor do wersji 0.4.9.12. Ta pilna aktualizacja zabezpieczeń naprawia kilka luk typu use-after-free i odmowy usługi przez wyczerpanie pamięci, zaostrza walidację DNS oraz poprawia kontrolę przeciążenia i izolację strumieni. Operatorzy przekaźników powinni szybko przeprowadzić aktualizację, ponieważ serwery katalogowe nie akceptują już deskryptorów z przestarzałymi kluczami TAP. [Pełne informacje o wydaniu upstream](https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.12/ReleaseNotes)',
    fr_FR:
      'Tor a été mis à jour vers la version 0.4.9.12. Cette mise à jour de sécurité urgente corrige plusieurs vulnérabilités d’utilisation de mémoire après libération et de déni de service par épuisement de mémoire, renforce la validation DNS et corrige le contrôle de congestion ainsi que l’isolation des flux. Les opérateurs de relais doivent effectuer la mise à jour rapidement, car les autorités d’annuaire n’acceptent plus les descripteurs contenant des clés TAP obsolètes. [Notes de version upstream complètes](https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.12/ReleaseNotes)',
  },
  migrations: {},
})
