import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.17:2',
  releaseNotes: {
    en_US:
      'Updated the Snowflake bridge transport to 2.15.4. It fixes security flaws that let a crafted response crash Snowflake or exhaust its memory while connecting through a Snowflake bridge. Full notes: https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/snowflake/-/blob/v2.15.4/ChangeLog',
    es_ES:
      'Se actualizó el transporte de puente Snowflake a 2.15.4. Corrige fallos de seguridad que permitían que una respuesta manipulada bloqueara Snowflake o agotara su memoria al conectarse a través de un puente Snowflake. Notas completas: https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/snowflake/-/blob/v2.15.4/ChangeLog',
    de_DE:
      'Der Snowflake-Bridge-Transport wurde auf 2.15.4 aktualisiert. Er behebt Sicherheitslücken, durch die eine manipulierte Antwort Snowflake beim Verbinden über eine Snowflake-Brücke zum Absturz bringen oder seinen Speicher erschöpfen konnte. Vollständige Hinweise: https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/snowflake/-/blob/v2.15.4/ChangeLog',
    pl_PL:
      'Zaktualizowano transport mostków Snowflake do wersji 2.15.4. Usuwa luki bezpieczeństwa, przez które spreparowana odpowiedź mogła spowodować awarię Snowflake lub wyczerpać jego pamięć podczas łączenia przez mostek Snowflake. Pełne informacje: https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/snowflake/-/blob/v2.15.4/ChangeLog',
    fr_FR:
      "Le transport de pont Snowflake a été mis à jour vers la version 2.15.4. Elle corrige des failles de sécurité qui permettaient à une réponse malveillante de faire planter Snowflake ou d'épuiser sa mémoire lors d'une connexion via un pont Snowflake. Notes complètes : https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/snowflake/-/blob/v2.15.4/ChangeLog",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
