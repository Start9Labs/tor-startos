import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.11:2',
  releaseNotes: {
    en_US: `Updated to the StartOS 2.0 SDK. Onion services now reach their target apps over the internal LXC bridge instead of deprecated container hostnames — this repairs onion address routing and stops other services (e.g. Bitcoin) from restarting whenever Tor is installed, updated, or removed. The SOCKS proxy is now also exposed to other services at a fixed internal bridge address, so they can use Tor without watching or restarting on Tor changes.`,
    es_ES: `Actualizado al SDK 2.0 de StartOS. Los servicios onion ahora alcanzan sus aplicaciones de destino a través del puente LXC interno en lugar de nombres de host de contenedor obsoletos: esto repara el enrutamiento de direcciones onion y evita que otros servicios (por ejemplo, Bitcoin) se reinicien cada vez que se instala, actualiza o elimina Tor. El proxy SOCKS ahora también se expone a otros servicios en una dirección fija del puente interno, para que puedan usar Tor sin observar ni reiniciarse ante cambios de Tor.`,
    de_DE: `Auf das StartOS-2.0-SDK aktualisiert. Onion-Dienste erreichen ihre Ziel-Apps jetzt über die interne LXC-Bridge statt über veraltete Container-Hostnamen — das repariert das Routing von Onion-Adressen und verhindert, dass andere Dienste (z. B. Bitcoin) neu starten, wenn Tor installiert, aktualisiert oder entfernt wird. Der SOCKS-Proxy ist jetzt außerdem für andere Dienste unter einer festen internen Bridge-Adresse erreichbar, sodass sie Tor nutzen können, ohne Tor zu überwachen oder bei Tor-Änderungen neu zu starten.`,
    pl_PL: `Zaktualizowano do SDK StartOS 2.0. Usługi onion docierają teraz do docelowych aplikacji przez wewnętrzny mostek LXC zamiast przestarzałych nazw hostów kontenerów — naprawia to routing adresów onion i zapobiega restartowaniu innych usług (np. Bitcoin) przy każdej instalacji, aktualizacji lub usunięciu Tora. Proxy SOCKS jest teraz także udostępniane innym usługom pod stałym adresem wewnętrznego mostka, dzięki czemu mogą korzystać z Tora bez obserwowania go i bez restartów przy zmianach Tora.`,
    fr_FR: `Mise à jour vers le SDK StartOS 2.0. Les services onion atteignent désormais leurs applications cibles via le pont LXC interne au lieu de noms d'hôtes de conteneurs obsolètes — cela répare le routage des adresses onion et empêche d'autres services (par ex. Bitcoin) de redémarrer chaque fois que Tor est installé, mis à jour ou supprimé. Le proxy SOCKS est désormais aussi exposé aux autres services à une adresse fixe du pont interne, afin qu'ils puissent utiliser Tor sans le surveiller ni redémarrer lors de changements de Tor.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
