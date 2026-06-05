import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.9:1',
  releaseNotes: {
    en_US: `**Fixes**

- Restored non-SSL Tor onion services for standard HTTP interfaces, which a recent release wrongly refused to create ("…exposes no plaintext endpoint…"). Non-SSL onions again forward to the service's plaintext endpoint.

**Bumps**

- Tor → 0.4.9.9 (upstream security release)`,
    es_ES: `**Correcciones**

- Se restauró la creación de servicios Tor onion sin SSL para interfaces HTTP estándar, que una versión reciente rechazaba por error («…no expone ningún punto de acceso en texto plano…»). Los onion sin SSL vuelven a reenviar al punto de acceso en texto plano del servicio.

**Actualizaciones**

- Tor → 0.4.9.9 (versión de seguridad oficial)`,
    de_DE: `**Korrekturen**

- Non-SSL-Tor-Onion-Dienste für Standard-HTTP-Schnittstellen wiederhergestellt; eine kürzliche Version verweigerte deren Erstellung fälschlicherweise („…stellt keinen Klartext-Endpunkt bereit…"). Non-SSL-Onions leiten wieder an den Klartext-Endpunkt des Dienstes weiter.

**Aktualisierungen**

- Tor → 0.4.9.9 (Upstream-Sicherheitsrelease)`,
    pl_PL: `**Poprawki**

- Przywrócono tworzenie usług Tor onion bez SSL dla standardowych interfejsów HTTP, których niedawne wydanie błędnie odmawiało utworzenia („…nie udostępnia punktu końcowego w postaci niezaszyfrowanej…"). Onion bez SSL ponownie przekazują ruch do punktu końcowego usługi w postaci niezaszyfrowanej.

**Aktualizacje**

- Tor → 0.4.9.9 (wydanie zabezpieczające od twórców)`,
    fr_FR: `**Corrections**

- Rétablissement de la création des services Tor onion sans SSL pour les interfaces HTTP standard, qu'une version récente refusait à tort (« …n'expose aucun point d'accès en clair… »). Les onions sans SSL redirigent à nouveau vers le point d'accès en clair du service.

**Mises à jour**

- Tor → 0.4.9.9 (version de sécurité officielle)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
