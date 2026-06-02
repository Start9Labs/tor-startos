import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.9:0',
  releaseNotes: {
    en_US: `**Fixes**

- Fixed non-SSL Tor onion services breaking after the target service's container IP changed. They pointed at a DNS name (\`<packageId>.startos:<port>\`) whose IP tor resolves once and caches for the life of the config, so when the upstream IP moved tor kept dialing the dead address — producing \`EndReason::MISC\` on stream begin and "I/O error: SOCKS: Connection refused" in client UIs. Onion services now forward to the static lxcbr0 ipv4 gateway address (matches the SSL branch), which never goes stale.
- Added a one-time torrc migration that reconciles every existing non-SSL HiddenServicePort target against the upstream package's current binding, so onion services created by older Tor wrappers start working again without manual delete/re-add.
- Adding a non-SSL onion service to an SSL-only interface now fails with a clear error instead of creating a broken service; any such record left by an older version is cleaned up on startup.

**Bumps**

- Tor → 0.4.9.9 (upstream security release)`,
    es_ES: `**Correcciones**

- Se corrigió que los servicios Tor onion sin SSL dejaran de funcionar cuando cambiaba la IP del contenedor del servicio de destino. Apuntaban a un nombre DNS (\`<packageId>.startos:<port>\`) cuya IP tor resuelve una sola vez y almacena en caché durante toda la vida de la configuración, así que cuando la IP original cambiaba tor seguía marcando la dirección muerta, produciendo \`EndReason::MISC\` al abrir el flujo y "I/O error: SOCKS: Connection refused" en las interfaces cliente. Los servicios onion ahora reenvían a la dirección estática de la puerta de enlace ipv4 de lxcbr0 (coincide con la rama SSL), que nunca queda obsoleta.
- Se añadió una migración única de torrc que reconcilia cada destino HiddenServicePort sin SSL existente con la asignación actual del paquete original, de modo que los servicios onion creados por envoltorios Tor anteriores vuelven a funcionar sin necesidad de eliminarlos y recrearlos manualmente.
- Añadir un servicio onion sin SSL a una interfaz solo-SSL ahora falla con un error claro en lugar de crear un servicio roto; cualquier registro de ese tipo dejado por una versión anterior se limpia al iniciar.

**Actualizaciones**

- Tor → 0.4.9.9 (versión de seguridad oficial)`,
    de_DE: `**Korrekturen**

- Behoben, dass Non-SSL-Tor-Onion-Dienste nicht mehr funktionierten, nachdem sich die Container-IP des Zieldienstes geändert hatte. Sie verwiesen auf einen DNS-Namen (\`<packageId>.startos:<port>\`), dessen IP Tor nur einmal auflöst und für die gesamte Lebensdauer der Konfiguration zwischenspeichert; änderte sich die Upstream-IP, wählte Tor weiter die tote Adresse an und erzeugte beim Stream-Begin \`EndReason::MISC\` und in Client-Oberflächen „I/O error: SOCKS: Connection refused". Onion-Dienste leiten jetzt an die statische lxcbr0-ipv4-Gateway-Adresse weiter (entspricht dem SSL-Zweig), die nie veraltet.
- Eine einmalige torrc-Migration hinzugefügt, die jedes vorhandene Non-SSL-HiddenServicePort-Ziel gegen die aktuelle Bindung des Upstream-Pakets abgleicht, sodass von älteren Tor-Wrappern erstellte Onion-Dienste wieder funktionieren, ohne sie manuell löschen und neu anlegen zu müssen.
- Das Hinzufügen eines Non-SSL-Onion-Dienstes zu einer reinen SSL-Schnittstelle schlägt jetzt mit einer klaren Fehlermeldung fehl, statt einen defekten Dienst zu erstellen; ein solcher von einer älteren Version hinterlassener Eintrag wird beim Start bereinigt.

**Aktualisierungen**

- Tor → 0.4.9.9 (Upstream-Sicherheitsrelease)`,
    pl_PL: `**Poprawki**

- Naprawiono przestawanie działania usług Tor onion bez SSL po zmianie adresu IP kontenera usługi docelowej. Wskazywały one na nazwę DNS (\`<packageId>.startos:<port>\`), której IP tor rozwiązuje tylko raz i buforuje przez cały czas życia konfiguracji, więc gdy pierwotny adres IP się zmieniał, tor nadal łączył się z martwym adresem, powodując \`EndReason::MISC\` przy otwieraniu strumienia oraz "I/O error: SOCKS: Connection refused" w interfejsach klientów. Usługi onion są teraz przekazywane na statyczny adres bramy ipv4 lxcbr0 (zgodnie z gałęzią SSL), który nigdy się nie dezaktualizuje.
- Dodano jednorazową migrację torrc, która uzgadnia każdy istniejący cel HiddenServicePort bez SSL z aktualnym powiązaniem pakietu nadrzędnego, dzięki czemu usługi onion utworzone przez starsze opakowania Tora znów działają bez ręcznego usuwania i ponownego dodawania.
- Dodanie usługi onion bez SSL do interfejsu wyłącznie SSL kończy się teraz czytelnym błędem zamiast tworzenia uszkodzonej usługi; każdy taki wpis pozostawiony przez starszą wersję jest usuwany przy starcie.

**Aktualizacje**

- Tor → 0.4.9.9 (wydanie zabezpieczające od twórców)`,
    fr_FR: `**Corrections**

- Correction des services Tor onion sans SSL qui cessaient de fonctionner après un changement d'IP du conteneur du service cible. Ils pointaient vers un nom DNS (\`<packageId>.startos:<port>\`) dont l'IP est résolue une seule fois par tor puis mise en cache pour toute la durée de vie de la configuration ; lorsque l'IP amont changeait, tor continuait d'appeler l'adresse morte, produisant \`EndReason::MISC\` à l'ouverture du flux et « I/O error: SOCKS: Connection refused » dans les interfaces clientes. Les services onion sont désormais redirigés vers l'adresse statique de la passerelle ipv4 lxcbr0 (identique à la branche SSL), qui ne devient jamais obsolète.
- Ajout d'une migration torrc unique qui réconcilie chaque cible HiddenServicePort sans SSL existante avec la liaison actuelle du paquet amont, de sorte que les services onion créés par d'anciens wrappers Tor refonctionnent sans suppression/recréation manuelle.
- L'ajout d'un service onion sans SSL à une interface uniquement SSL échoue désormais avec une erreur claire au lieu de créer un service défectueux ; tout enregistrement de ce type laissé par une version antérieure est nettoyé au démarrage.

**Mises à jour**

- Tor → 0.4.9.9 (version de sécurité officielle)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
