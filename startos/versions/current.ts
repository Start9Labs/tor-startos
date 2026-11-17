import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.17:1',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.2 or later. The obfs4, WebTunnel and Snowflake bridge transports are rebuilt with a current Go release, which rejects certificates from the compromised eMudhra intermediate CAs. Add Onion Service now refuses a private key that is not a valid 64-byte expanded ed25519 key.',
    es_ES:
      'Requiere StartOS 0.4.2 o posterior. Los transportes de puente obfs4, WebTunnel y Snowflake se recompilan con una versión actual de Go, que rechaza los certificados de las CA intermedias comprometidas de eMudhra. Agregar servicio onion ahora rechaza una clave privada que no sea una clave ed25519 expandida válida de 64 bytes.',
    de_DE:
      'Erfordert StartOS 0.4.2 oder neuer. Die Bridge-Transporte obfs4, WebTunnel und Snowflake werden mit einer aktuellen Go-Version neu gebaut, die Zertifikate der kompromittierten eMudhra-Zwischenzertifizierungsstellen ablehnt. Onion-Dienst hinzufügen weist jetzt einen privaten Schlüssel zurück, der kein gültiger 64-Byte-erweiterter ed25519-Schlüssel ist.',
    pl_PL:
      'Wymaga StartOS 0.4.2 lub nowszego. Transporty mostków obfs4, WebTunnel i Snowflake są zbudowane ponownie z aktualną wersją Go, która odrzuca certyfikaty przejętych pośrednich urzędów certyfikacji eMudhra. Dodaj usługę onion odrzuca teraz klucz prywatny, który nie jest prawidłowym 64-bajtowym rozszerzonym kluczem ed25519.',
    fr_FR:
      "Nécessite StartOS 0.4.2 ou une version ultérieure. Les transports de pont obfs4, WebTunnel et Snowflake sont recompilés avec une version actuelle de Go, qui rejette les certificats des autorités intermédiaires eMudhra compromises. Ajouter un service onion refuse désormais une clé privée qui n'est pas une clé ed25519 étendue valide de 64 octets.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
