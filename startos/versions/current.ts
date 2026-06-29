import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.11:0',
  releaseNotes: {
    en_US: `Updated Tor to 0.4.9.11.

Security release — upgrading is strongly recommended.

- Fixes a race condition that could let a rendezvous point impersonate (man-in-the-middle) the onion service a client is connecting to (bug 41297).
- Fixes a use-after-free / potential double-free of a conflux object that a malicious exit could use to crash a client (TROVE-2026-026, bug 41306).
- Clients no longer assert and exit when an onion service encodes an all-zero introduction-point public key (bug 41295).

Full changelog: https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.11/ChangeLog`,
    es_ES: `Se actualizó Tor a 0.4.9.11.

Versión de seguridad: se recomienda encarecidamente actualizar.

- Corrige una condición de carrera que podía permitir que un punto de encuentro suplantara (ataque de intermediario) al servicio onion al que se conecta un cliente (error 41297).
- Corrige un uso después de liberar / posible doble liberación de un objeto conflux que un nodo de salida malicioso podía usar para bloquear a un cliente (TROVE-2026-026, error 41306).
- Los clientes ya no fallan ni se cierran cuando un servicio onion codifica una clave pública de punto de introducción con todos los bits en cero (error 41295).

Registro de cambios completo: https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.11/ChangeLog`,
    de_DE: `Tor auf 0.4.9.11 aktualisiert.

Sicherheits-Release – ein Upgrade wird dringend empfohlen.

- Behebt eine Race-Condition, durch die ein Rendezvous-Punkt den Onion-Dienst, mit dem sich ein Client verbindet, imitieren (Man-in-the-Middle) konnte (Fehler 41297).
- Behebt eine Use-after-free- / mögliche Double-free-Lücke bei einem Conflux-Objekt, die ein bösartiger Exit-Knoten zum Absturz eines Clients ausnutzen konnte (TROVE-2026-026, Fehler 41306).
- Clients brechen nicht mehr mit einem Assert ab, wenn ein Onion-Dienst einen Introduction-Point-Public-Key aus lauter Nullen kodiert (Fehler 41295).

Vollständiges Änderungsprotokoll: https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.11/ChangeLog`,
    pl_PL: `Zaktualizowano Tor do 0.4.9.11.

Wydanie zabezpieczające — zdecydowanie zalecana aktualizacja.

- Naprawia sytuację wyścigu, która mogła pozwolić punktowi spotkań podszyć się (atak man-in-the-middle) pod usługę onion, z którą łączy się klient (błąd 41297).
- Naprawia użycie po zwolnieniu / potencjalne podwójne zwolnienie obiektu conflux, które złośliwy węzeł wyjściowy mógł wykorzystać do awarii klienta (TROVE-2026-026, błąd 41306).
- Klienci nie kończą już działania asercją, gdy usługa onion zakoduje całkowicie zerowy klucz publiczny punktu wprowadzenia (błąd 41295).

Pełny dziennik zmian: https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.11/ChangeLog`,
    fr_FR: `Tor mis à jour vers 0.4.9.11.

Version de sécurité — la mise à niveau est fortement recommandée.

- Corrige une situation de concurrence qui pouvait permettre à un point de rendez-vous d'usurper l'identité (attaque de l'intercepteur) du service onion auquel un client se connecte (bogue 41297).
- Corrige une utilisation après libération / double libération potentielle d'un objet conflux qu'un nœud de sortie malveillant pouvait exploiter pour faire planter un client (TROVE-2026-026, bogue 41306).
- Les clients ne s'arrêtent plus sur une assertion lorsqu'un service onion encode une clé publique de point d'introduction entièrement à zéro (bogue 41295).

Journal des modifications complet : https://gitlab.torproject.org/tpo/core/tor/-/raw/tor-0.4.9.11/ChangeLog`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
