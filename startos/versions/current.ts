import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.12:6',
  releaseNotes: {
    en_US: `The Relay Reachability health check no longer opens its own connection to Tor, which had doubled the "New control connection opened" lines in a relay's logs.`,
    es_ES: `La comprobación de estado Accesibilidad del relé ya no abre su propia conexión con Tor, lo que había duplicado las líneas "New control connection opened" en los registros de un relé.`,
    de_DE: `Die Statusprüfung Relay-Erreichbarkeit öffnet keine eigene Verbindung zu Tor mehr; dadurch hatten sich die Zeilen "New control connection opened" in den Protokollen eines Relays verdoppelt.`,
    pl_PL: `Kontrola stanu Osiągalność przekaźnika nie otwiera już własnego połączenia z Torem, co podwajało liczbę wierszy "New control connection opened" w dziennikach przekaźnika.`,
    fr_FR: `Le contrôle d'état Accessibilité du relais n'ouvre plus sa propre connexion à Tor, ce qui avait doublé les lignes "New control connection opened" dans les journaux d'un relais.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
