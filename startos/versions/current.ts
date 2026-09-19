import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.12:4',
  releaseNotes: {
    en_US: `- Relay and bridge mode advertise the IP address of the connection whose Public address you enabled, when it is enabled on exactly one, instead of whichever one Tor's outgoing traffic uses. They also advertise the port StartOS actually assigned to the OR port.
- A new Relay Reachability health check shows whether the Tor network can reach your relay.
- Tor no longer logs "Unable to find IPv6 address for ORPort" every hour when no public IPv6 address is enabled for the relay.`,
    es_ES: `- Los modos relé y puente anuncian la dirección IP de la conexión en la que habilitó la dirección pública, cuando está habilitada en una sola, en lugar de la que use el tráfico saliente de Tor. También anuncian el puerto que StartOS asignó realmente al puerto OR.
- Una nueva comprobación de estado, Accesibilidad del relé, muestra si la red Tor puede alcanzar su relé.
- Tor ya no registra cada hora "Unable to find IPv6 address for ORPort" cuando no hay ninguna dirección IPv6 pública habilitada para el relé.`,
    de_DE: `- Relay- und Bridge-Modus geben die IP-Adresse der Verbindung bekannt, auf der Sie die öffentliche Adresse aktiviert haben, sofern sie auf genau einer aktiviert ist, statt der, über die Tors ausgehender Verkehr läuft. Außerdem geben sie den Port bekannt, den StartOS dem OR-Port tatsächlich zugewiesen hat.
- Eine neue Statusprüfung, Relay-Erreichbarkeit, zeigt, ob das Tor-Netzwerk Ihr Relay erreichen kann.
- Tor protokolliert nicht mehr stündlich "Unable to find IPv6 address for ORPort", wenn für das Relay keine öffentliche IPv6-Adresse aktiviert ist.`,
    pl_PL: `- Tryby przekaźnika i mostka ogłaszają adres IP połączenia, na którym włączono adres publiczny, jeśli jest włączony na dokładnie jednym, zamiast tego, przez które wychodzi ruch Tora. Ogłaszają też port, który StartOS faktycznie przypisał portowi OR.
- Nowa kontrola stanu, Osiągalność przekaźnika, pokazuje, czy sieć Tor może połączyć się z Twoim przekaźnikiem.
- Tor nie zapisuje już co godzinę komunikatu "Unable to find IPv6 address for ORPort", gdy dla przekaźnika nie włączono żadnego publicznego adresu IPv6.`,
    fr_FR: `- Les modes relais et pont annoncent l'adresse IP de la connexion sur laquelle vous avez activé l'adresse publique, lorsqu'elle est activée sur une seule, plutôt que celle qu'emprunte le trafic sortant de Tor. Ils annoncent aussi le port que StartOS a réellement attribué au port OR.
- Un nouveau contrôle d'état, Accessibilité du relais, indique si le réseau Tor peut joindre votre relais.
- Tor ne journalise plus toutes les heures "Unable to find IPv6 address for ORPort" lorsqu'aucune adresse IPv6 publique n'est activée pour le relais.`,
  },
  migrations: {
    up: async ({ effects }) => {},
  },
})
