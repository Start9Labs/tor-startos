import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.8:2',
  releaseNotes: {
    en_US: `**Fixes**

- Fixed the bootstrap health check showing "Bootstrapping: 0%" long after Tor had finished, by polling progress every second while loading
- Fixed a bug where uninstalling a service would momentarily clear every package's Tor (.onion) address, causing unrelated services to restart

**Bumps**

- start-sdk → 1.5.3`,
    es_ES: `**Correcciones**

- Se corrigió que la comprobación de estado mostrara "Arrancando: 0%" mucho después de que Tor hubiera terminado, consultando el progreso cada segundo durante la carga
- Se corrigió un error por el cual desinstalar un servicio borraba momentáneamente la dirección Tor (.onion) de cada paquete, provocando el reinicio de servicios no relacionados

**Actualizaciones**

- start-sdk → 1.5.3`,
    de_DE: `**Korrekturen**

- Behoben, dass die Zustandsprüfung „Bootstrapping: 0%“ lange anzeigte, nachdem Tor bereits fertig war, indem der Fortschritt während des Ladens jede Sekunde abgefragt wird
- Ein Fehler wurde behoben, durch den das Deinstallieren eines Dienstes vorübergehend die Tor-Adresse (.onion) jedes Pakets löschte und so den Neustart nicht zusammenhängender Dienste verursachte

**Aktualisierungen**

- start-sdk → 1.5.3`,
    pl_PL: `**Poprawki**

- Naprawiono kontrolę stanu pokazującą „Uruchamianie: 0%” długo po zakończeniu pracy Tora, odpytując postęp co sekundę podczas ładowania
- Naprawiono błąd, w którym odinstalowanie usługi chwilowo usuwało adres Tor (.onion) każdego pakietu, powodując ponowne uruchomienie niepowiązanych usług

**Aktualizacje**

- start-sdk → 1.5.3`,
    fr_FR: `**Corrections**

- Correction du contrôle d'intégrité affichant « Démarrage : 0% » longtemps après la fin de Tor, en interrogeant la progression chaque seconde pendant le chargement
- Correction d'un bug où la désinstallation d'un service effaçait momentanément l'adresse Tor (.onion) de chaque paquet, provoquant le redémarrage de services sans rapport

**Mises à jour**

- start-sdk → 1.5.3`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
