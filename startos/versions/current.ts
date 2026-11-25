import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.17:4',
  releaseNotes: {
    en_US:
      'A service can receive the connections to its .onion addresses on a port of their own, separate from its other addresses.',
    es_ES:
      'Un servicio puede recibir las conexiones a sus direcciones .onion en un puerto propio, separado de sus demás direcciones.',
    de_DE:
      'Ein Dienst kann die Verbindungen zu seinen .onion-Adressen auf einem eigenen Port empfangen, getrennt von seinen übrigen Adressen.',
    pl_PL:
      'Usługa może odbierać połączenia do swoich adresów .onion na osobnym porcie, oddzielnie od pozostałych adresów.',
    fr_FR:
      'Un service peut recevoir les connexions à ses adresses .onion sur un port qui leur est propre, distinct de ses autres adresses.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
