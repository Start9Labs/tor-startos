import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.11:6',
  releaseNotes: {
    en_US: `- Fixes an issue where the Tor service could get stuck at high CPU usage, causing onion address changes to time out.
- The Add Onion Service dialog now lists an existing .onion address only when the selected interface still has a binding it isn't already attached to (non-SSL, plus SSL when available).
- Hotfixes legacy StartOS UI onion entries so package migration does not pass the old uppercase STARTOS sentinel into URL cleanup.`,
    es_ES: `- Corrige un problema por el que el servicio Tor podía quedarse con un uso elevado de CPU, provocando que los cambios de direcciones onion agotaran el tiempo de espera.
- El diálogo Agregar servicio onion ahora muestra una dirección .onion existente solo cuando la interfaz seleccionada aún tiene un enlace al que no está asociada (no SSL, y SSL cuando esté disponible).
- Corrige entradas onion heredadas de la interfaz StartOS para que la migración del paquete no pase el antiguo marcador STARTOS en mayúsculas a la limpieza de URLs.`,
    de_DE: `- Behebt ein Problem, bei dem der Tor-Dienst bei hoher CPU-Auslastung hängen bleiben konnte, wodurch Änderungen an Onion-Adressen eine Zeitüberschreitung verursachten.
- Der Dialog „Onion-Dienst hinzufügen“ zeigt eine vorhandene .onion-Adresse jetzt nur an, wenn die ausgewählte Schnittstelle noch eine Bindung hat, an die sie nicht bereits angehängt ist (Nicht-SSL sowie SSL, sofern verfügbar).
- Behebt alte Onion-Einträge der StartOS-Oberfläche, damit die Paketmigration den alten STARTOS-Marker nicht an die URL-Bereinigung übergibt.`,
    pl_PL: `- Naprawia problem, w którym usługa Tor mogła utknąć przy wysokim zużyciu procesora, powodując przekroczenie limitu czasu przy zmianach adresów onion.
- Okno „Dodaj usługę onion“ pokazuje teraz istniejący adres .onion tylko wtedy, gdy wybrany interfejs ma jeszcze powiązanie, do którego adres nie jest już przypisany (bez SSL oraz SSL, jeśli jest dostępne).
- Naprawia starsze wpisy onion interfejsu StartOS, aby migracja pakietu nie przekazywała starego znacznika STARTOS do czyszczenia adresów URL.`,
    fr_FR: `- Corrige un problème où le service Tor pouvait rester bloqué à une utilisation élevée du processeur, provoquant l'expiration des modifications d'adresses onion.
- La boîte de dialogue « Ajouter un service onion » n'affiche désormais une adresse .onion existante que si l'interface sélectionnée possède encore une liaison à laquelle elle n'est pas déjà rattachée (sans SSL, et SSL lorsqu'il est disponible).
- Corrige les anciennes entrées onion de l'interface StartOS afin que la migration du paquet ne transmette pas l'ancien marqueur STARTOS au nettoyage des URLs.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
