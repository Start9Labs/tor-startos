import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.17:0',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.2 or later. Updated Tor to 0.4.9.17, which stops trusting a directory authority whose keys may have been compromised and rejects malformed DNS replies from exit relays. Full notes: https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.17/ChangeLog',
    es_ES:
      'Requiere StartOS 0.4.2 o posterior. Tor actualizado a 0.4.9.17, que deja de confiar en una autoridad de directorio cuyas claves pueden haber sido comprometidas y rechaza respuestas DNS malformadas de los relés de salida. Notas completas: https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.17/ChangeLog',
    de_DE:
      'Erfordert StartOS 0.4.2 oder neuer. Tor auf 0.4.9.17 aktualisiert: vertraut einer Verzeichnisautorität, deren Schlüssel möglicherweise kompromittiert wurden, nicht mehr und weist fehlerhafte DNS-Antworten von Exit-Relays zurück. Vollständige Hinweise: https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.17/ChangeLog',
    pl_PL:
      'Wymaga StartOS 0.4.2 lub nowszego. Zaktualizowano Tor do 0.4.9.17, który przestaje ufać serwerowi katalogowemu, którego klucze mogły zostać przejęte, i odrzuca błędne odpowiedzi DNS od przekaźników wyjściowych. Pełne informacje: https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.17/ChangeLog',
    fr_FR:
      "Nécessite StartOS 0.4.2 ou une version ultérieure. Tor mis à jour vers 0.4.9.17, qui cesse de faire confiance à une autorité d'annuaire dont les clés ont pu être compromises et rejette les réponses DNS malformées des relais de sortie. Notes complètes : https://gitlab.torproject.org/tpo/core/tor/-/blob/tor-0.4.9.17/ChangeLog",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
