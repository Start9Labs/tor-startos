import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.8:1',
  releaseNotes: {
    en_US: `**Fixes**

- Fixed a bug where uninstalling a service would momentarily clear every package's Tor (.onion) address, causing unrelated services to restart

**Bumps**

- start-sdk → 1.5.3`,
    es_ES: `**Correcciones**

- Se corrigió un error por el cual desinstalar un servicio borraba momentáneamente la dirección Tor (.onion) de cada paquete, provocando el reinicio de servicios no relacionados

**Actualizaciones**

- start-sdk → 1.5.3`,
    de_DE: `**Korrekturen**

- Ein Fehler wurde behoben, durch den das Deinstallieren eines Dienstes vorübergehend die Tor-Adresse (.onion) jedes Pakets löschte und so den Neustart nicht zusammenhängender Dienste verursachte

**Aktualisierungen**

- start-sdk → 1.5.3`,
    pl_PL: `**Poprawki**

- Naprawiono błąd, w którym odinstalowanie usługi chwilowo usuwało adres Tor (.onion) każdego pakietu, powodując ponowne uruchomienie niepowiązanych usług

**Aktualizacje**

- start-sdk → 1.5.3`,
    fr_FR: `**Corrections**

- Correction d'un bug où la désinstallation d'un service effaçait momentanément l'adresse Tor (.onion) de chaque paquet, provoquant le redémarrage de services sans rapport

**Mises à jour**

- start-sdk → 1.5.3`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
