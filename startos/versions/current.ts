import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.10:0',
  releaseNotes: {
    en_US: `Updated Tor to 0.4.9.10.

Security release — upgrading is strongly recommended.

- Fixes a use-after-free triggered by a malicious conflux client (TROVE-2026-025).
- Restores warnings about unsafe SOCKS protocols when SafeSocks is not set.
- Expires entry guards more consistently (48–60 days) and fixes assorted client/relay bugs.

Full changelog: https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.10/ChangeLog`,
    es_ES: `Se actualizó Tor a 0.4.9.10.

Versión de seguridad: se recomienda encarecidamente actualizar.

- Corrige un uso después de liberar provocado por un cliente conflux malicioso (TROVE-2026-025).
- Restaura las advertencias sobre protocolos SOCKS inseguros cuando SafeSocks no está configurado.
- Expira los guardias de entrada de forma más consistente (48–60 días) y corrige varios errores de cliente/repetidor.

Registro de cambios completo: https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.10/ChangeLog`,
    de_DE: `Tor auf 0.4.9.10 aktualisiert.

Sicherheits-Release – ein Upgrade wird dringend empfohlen.

- Behebt eine Use-after-free-Lücke, die von einem bösartigen Conflux-Client ausgelöst wird (TROVE-2026-025).
- Stellt Warnungen vor unsicheren SOCKS-Protokollen wieder her, wenn SafeSocks nicht gesetzt ist.
- Lässt Entry-Guards konsistenter ablaufen (48–60 Tage) und behebt diverse Client-/Relay-Fehler.

Vollständiges Änderungsprotokoll: https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.10/ChangeLog`,
    pl_PL: `Zaktualizowano Tor do 0.4.9.10.

Wydanie zabezpieczające — zdecydowanie zalecana aktualizacja.

- Naprawia użycie po zwolnieniu pamięci wywoływane przez złośliwego klienta conflux (TROVE-2026-025).
- Przywraca ostrzeżenia o niebezpiecznych protokołach SOCKS, gdy SafeSocks nie jest ustawione.
- Bardziej konsekwentnie wygasza strażników wejściowych (48–60 dni) oraz naprawia różne błędy klienta/przekaźnika.

Pełny dziennik zmian: https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.10/ChangeLog`,
    fr_FR: `Tor mis à jour vers 0.4.9.10.

Version de sécurité — la mise à niveau est fortement recommandée.

- Corrige une utilisation après libération déclenchée par un client conflux malveillant (TROVE-2026-025).
- Rétablit les avertissements concernant les protocoles SOCKS non sécurisés lorsque SafeSocks n'est pas défini.
- Expire les gardes d'entrée de manière plus cohérente (48–60 jours) et corrige divers bogues client/relais.

Journal des modifications complet : https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.10/ChangeLog`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
