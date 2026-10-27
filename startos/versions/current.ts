import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.14:2',
  releaseNotes: {
    en_US:
      'Adds Connect via Bridges, which reaches the Tor network through obfs4, WebTunnel or Snowflake bridges on networks that block Tor.',
    es_ES:
      'Añade Conectar mediante puentes, que accede a la red Tor a través de puentes obfs4, WebTunnel o Snowflake en redes que bloquean Tor.',
    de_DE:
      'Neue Aktion „Über Brücken verbinden“: Tor erreicht das Tor-Netzwerk damit über obfs4-, WebTunnel- oder Snowflake-Brücken, auch wo Tor blockiert ist.',
    pl_PL:
      'Dodaje akcję Połącz przez mostki, która łączy z siecią Tor przez mostki obfs4, WebTunnel lub Snowflake w sieciach blokujących Tora.',
    fr_FR:
      "Ajoute l'action Se connecter via des ponts, qui rejoint le réseau Tor via des ponts obfs4, WebTunnel ou Snowflake sur les réseaux qui bloquent Tor.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
