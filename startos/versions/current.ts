import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.11:2',
  releaseNotes: {
    en_US: `Updated to the StartOS 2.0 SDK. Onion services now reach their target apps over the internal LXC bridge instead of deprecated container hostnames — this repairs onion address routing and stops other services (e.g. Bitcoin) from restarting whenever Tor is installed, updated, or removed.`,
    es_ES: `Actualizado al SDK 2.0 de StartOS. Los servicios onion ahora alcanzan sus aplicaciones de destino a través del puente LXC interno en lugar de nombres de host de contenedor obsoletos: esto repara el enrutamiento de direcciones onion y evita que otros servicios (por ejemplo, Bitcoin) se reinicien cada vez que se instala, actualiza o elimina Tor.`,
    de_DE: `Auf das StartOS-2.0-SDK aktualisiert. Onion-Dienste erreichen ihre Ziel-Apps jetzt über die interne LXC-Bridge statt über veraltete Container-Hostnamen — das repariert das Routing von Onion-Adressen und verhindert, dass andere Dienste (z. B. Bitcoin) neu starten, wenn Tor installiert, aktualisiert oder entfernt wird.`,
    pl_PL: `Zaktualizowano do SDK StartOS 2.0. Usługi onion docierają teraz do docelowych aplikacji przez wewnętrzny mostek LXC zamiast przestarzałych nazw hostów kontenerów — naprawia to routing adresów onion i zapobiega restartowaniu innych usług (np. Bitcoin) przy każdej instalacji, aktualizacji lub usunięciu Tora.`,
    fr_FR: `Mise à jour vers le SDK StartOS 2.0. Les services onion atteignent désormais leurs applications cibles via le pont LXC interne au lieu de noms d'hôtes de conteneurs obsolètes — cela répare le routage des adresses onion et empêche d'autres services (par ex. Bitcoin) de redémarrer chaque fois que Tor est installé, mis à jour ou supprimé.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
