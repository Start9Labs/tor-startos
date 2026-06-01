import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.8:3',
  releaseNotes: {
    en_US: `**Fixes**

- Fixed non-SSL Tor onion services pointing at unreachable sibling-container DNS names (\`<packageId>.startos:<port>\`), which produced \`EndReason::MISC\` on stream begin and "I/O error: SOCKS: Connection refused" in client UIs. Onion services now forward to the lxcbr0 ipv4 gateway address (matches the SSL branch).
- Added a one-time torrc migration that reconciles every existing non-SSL HiddenServicePort target against the upstream package's current binding, so onion services created by older Tor wrappers start working again without manual delete/re-add.`,
    es_ES: `**Correcciones**

- Se corrigió que los servicios Tor onion sin SSL apuntaran a nombres DNS de contenedores hermanos inalcanzables (\`<packageId>.startos:<port>\`), lo que producía \`EndReason::MISC\` al abrir el flujo y "I/O error: SOCKS: Connection refused" en las interfaces cliente. Los servicios onion ahora reenvían a la dirección de la puerta de enlace ipv4 de lxcbr0 (coincide con la rama SSL).
- Se añadió una migración única de torrc que reconcilia cada destino HiddenServicePort sin SSL existente con la asignación actual del paquete original, de modo que los servicios onion creados por envoltorios Tor anteriores vuelven a funcionar sin necesidad de eliminarlos y recrearlos manualmente.`,
    de_DE: `**Korrekturen**

- Behoben, dass Non-SSL-Tor-Onion-Dienste auf nicht erreichbare DNS-Namen von Geschwister-Containern (\`<packageId>.startos:<port>\`) verwiesen, was beim Stream-Begin \`EndReason::MISC\` und in Client-Oberflächen „I/O error: SOCKS: Connection refused" erzeugte. Onion-Dienste leiten jetzt an die lxcbr0-ipv4-Gateway-Adresse weiter (entspricht dem SSL-Zweig).
- Eine einmalige torrc-Migration hinzugefügt, die jedes vorhandene Non-SSL-HiddenServicePort-Ziel gegen die aktuelle Bindung des Upstream-Pakets abgleicht, sodass von älteren Tor-Wrappern erstellte Onion-Dienste wieder funktionieren, ohne sie manuell löschen und neu anlegen zu müssen.`,
    pl_PL: `**Poprawki**

- Naprawiono kierowanie usług Tor onion bez SSL na nieosiągalne nazwy DNS kontenerów siostrzanych (\`<packageId>.startos:<port>\`), co powodowało \`EndReason::MISC\` przy otwieraniu strumienia oraz "I/O error: SOCKS: Connection refused" w interfejsach klientów. Usługi onion są teraz przekazywane na adres bramy ipv4 lxcbr0 (zgodnie z gałęzią SSL).
- Dodano jednorazową migrację torrc, która uzgadnia każdy istniejący cel HiddenServicePort bez SSL z aktualnym powiązaniem pakietu nadrzędnego, dzięki czemu usługi onion utworzone przez starsze opakowania Tora znów działają bez ręcznego usuwania i ponownego dodawania.`,
    fr_FR: `**Corrections**

- Correction des services Tor onion sans SSL pointant vers des noms DNS de conteneurs voisins injoignables (\`<packageId>.startos:<port>\`), ce qui produisait \`EndReason::MISC\` à l'ouverture du flux et « I/O error: SOCKS: Connection refused » dans les interfaces clientes. Les services onion sont désormais redirigés vers l'adresse de la passerelle ipv4 lxcbr0 (identique à la branche SSL).
- Ajout d'une migration torrc unique qui réconcilie chaque cible HiddenServicePort sans SSL existante avec la liaison actuelle du paquet amont, de sorte que les services onion créés par d'anciens wrappers Tor refonctionnent sans suppression/recréation manuelle.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
