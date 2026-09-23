import { mkdir, readdir, rename } from 'node:fs/promises'
import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import {
  onionId,
  OnionPort,
  Onions,
  present,
  storeJson,
} from '../fileModels/store.json'
import { torrcFile } from '../fileModels/torrc'
import { sdk } from '../sdk'
import { hasMarker } from '../torrc/render'
import { torrc as legacyTorrc } from './legacy/torrc'

/** What stays at the root of the tor volume; the rest is Tor's own data. */
const NOT_TOR_DATA = [
  'torrc',
  'torrc.legacy',
  'hidden_services',
  'keys',
  'control.sock',
  '.wipe-requested',
  '.auto-wiped',
  'data',
]

export const current = VersionInfo.of({
  version: '0.4.9.12:7',
  releaseNotes: {
    en_US: `**Relay and bridge mode have been removed.** A Tor relay's IP address is listed in Tor's public directory. When the same server also hosts .onion addresses, that listing gives an attacker a short list of servers to test, and load and timing measurements can then link an onion address to the server's IP. Running the two as separate processes does not prevent this; sharing a server is enough. The Tor Project advises against hosting onion services on a relay, and nearly every StartOS server hosts them, so this package no longer offers both. Relay support is planned to return as a separate service.

If you were running a relay, it stops with this update. The Tor Relay OR Port interface is gone, so any port forward you made for it on your router can be removed. Your relay's identity keys remain on the Tor volume and in its backups.

- Adds an Automatic Recovery setting. It is on by default, as before; turning it off makes Tor fail closed.
- An .onion address now follows its service when that service's ports move.
- The key behind an .onion address is never deleted automatically. An address no interface is using stays until you delete it with Delete Unused Onion Addresses, which replaces Delete Onion Addresses.
- Restoring Tor before the services that use its .onion addresses no longer deletes those addresses.
- You can add your own options to the top of Tor's configuration file, and they are kept.`,
    es_ES: `**Se han eliminado los modos de relé y de puente.** La dirección IP de un relé de Tor aparece en el directorio público de Tor. Cuando el mismo servidor aloja además direcciones .onion, esa lista le da a un atacante un conjunto reducido de servidores que probar, y las mediciones de carga y de tiempos pueden entonces vincular una dirección onion con la IP del servidor. Ejecutar ambos como procesos separados no lo impide; basta con que compartan servidor. El Proyecto Tor desaconseja alojar servicios onion en un relé, y casi todos los servidores StartOS los alojan, así que este paquete ya no ofrece ambas cosas. Está previsto que el relé vuelva como un servicio aparte.

Si tenía un relé en marcha, se detiene con esta actualización. La interfaz Puerto OR del relé de Tor desaparece, así que puede eliminar cualquier redirección de puertos que hubiera creado en su router. Las claves de identidad de su relé siguen en el volumen de Tor y en sus copias de seguridad.

- Añade el ajuste Recuperación automática. Sigue activado de forma predeterminada; al desactivarlo, Tor falla en cerrado.
- Una dirección .onion ahora sigue a su servicio cuando cambian los puertos de este.
- La clave de una dirección .onion nunca se elimina automáticamente. Una dirección que ninguna interfaz usa permanece hasta que la elimine con Eliminar direcciones onion sin usar, que sustituye a Eliminar direcciones onion.
- Restaurar Tor antes que los servicios que usan sus direcciones .onion ya no elimina esas direcciones.
- Puede añadir sus propias opciones al principio del archivo de configuración de Tor, y se conservan.`,
    de_DE: `**Relay- und Bridge-Modus wurden entfernt.** Die IP-Adresse eines Tor-Relays steht im öffentlichen Verzeichnis von Tor. Hostet derselbe Server auch .onion-Adressen, liefert dieses Verzeichnis einem Angreifer eine kurze Liste von Servern zum Testen, und Last- und Zeitmessungen können dann eine Onion-Adresse mit der IP des Servers verknüpfen. Beides als getrennte Prozesse zu betreiben verhindert das nicht; ein gemeinsamer Server genügt. Das Tor-Projekt rät davon ab, Onion-Dienste auf einem Relay zu hosten, und fast jeder StartOS-Server hostet sie, daher bietet dieses Paket nicht mehr beides an. Die Relay-Unterstützung soll als eigener Dienst zurückkehren.

Falls Sie ein Relay betrieben haben, endet es mit diesem Update. Die Schnittstelle „Tor-Relay-OR-Port“ entfällt, sodass Sie eine dafür im Router eingerichtete Portweiterleitung entfernen können. Die Identitätsschlüssel Ihres Relays bleiben auf dem Tor-Volume und in dessen Backups erhalten.

- Neue Einstellung „Automatische Wiederherstellung“. Sie ist wie bisher standardmäßig aktiv; ausgeschaltet verhält sich Tor fail-closed.
- Eine .onion-Adresse folgt jetzt ihrem Dienst, wenn sich dessen Ports ändern.
- Der Schlüssel einer .onion-Adresse wird nie automatisch gelöscht. Eine Adresse, die keine Schnittstelle verwendet, bleibt erhalten, bis Sie sie mit „Ungenutzte Onion-Adressen löschen“ löschen; diese Aktion ersetzt „Onion-Adressen löschen“.
- Wird Tor vor den Diensten wiederhergestellt, die seine .onion-Adressen nutzen, werden diese Adressen nicht mehr gelöscht.
- Sie können am Anfang der Tor-Konfigurationsdatei eigene Optionen eintragen; sie bleiben erhalten.`,
    pl_PL: `**Tryb przekaźnika i mostka został usunięty.** Adres IP przekaźnika Tor jest widoczny w publicznym katalogu Tora. Gdy ten sam serwer hostuje także adresy .onion, katalog ten daje atakującemu krótką listę serwerów do sprawdzenia, a pomiary obciążenia i czasu mogą wtedy powiązać adres onion z adresem IP serwera. Uruchomienie obu jako osobnych procesów temu nie zapobiega; wystarczy wspólny serwer. Projekt Tor odradza hostowanie usług onion na przekaźniku, a niemal każdy serwer StartOS je hostuje, dlatego ten pakiet nie oferuje już obu naraz. Obsługa przekaźnika ma wrócić jako osobna usługa.

Jeśli prowadziłeś przekaźnik, ta aktualizacja go zatrzymuje. Interfejs Port OR przekaźnika Tor znika, więc możesz usunąć przekierowanie portu utworzone dla niego na routerze. Klucze tożsamości przekaźnika pozostają na wolumenie Tora i w jego kopiach zapasowych.

- Dodaje ustawienie Automatyczne odzyskiwanie. Jest domyślnie włączone, jak dotąd; po wyłączeniu Tor działa w trybie fail-closed.
- Adres .onion podąża teraz za swoją usługą, gdy zmieniają się jej porty.
- Klucz adresu .onion nigdy nie jest usuwany automatycznie. Adres, którego nie używa żaden interfejs, pozostaje, dopóki nie usuniesz go akcją Usuń nieużywane adresy onion, która zastępuje akcję Usuń adresy onion.
- Przywrócenie Tora przed usługami korzystającymi z jego adresów .onion nie usuwa już tych adresów.
- Możesz dodać własne opcje na początku pliku konfiguracyjnego Tora i zostaną one zachowane.`,
    fr_FR: `**Les modes relais et pont ont été supprimés.** L'adresse IP d'un relais Tor figure dans l'annuaire public de Tor. Lorsque le même serveur héberge aussi des adresses .onion, cet annuaire fournit à un attaquant une courte liste de serveurs à tester, et des mesures de charge et de temps peuvent alors relier une adresse onion à l'IP du serveur. Les exécuter dans des processus séparés n'y change rien ; partager un serveur suffit. Le Projet Tor déconseille d'héberger des services onion sur un relais, et presque tous les serveurs StartOS en hébergent : ce paquet ne propose donc plus les deux. La prise en charge du relais devrait revenir sous forme de service distinct.

Si vous faisiez tourner un relais, il s'arrête avec cette mise à jour. L'interface Port OR du relais Tor disparaît ; vous pouvez donc supprimer la redirection de port créée pour elle sur votre routeur. Les clés d'identité de votre relais restent sur le volume Tor et dans ses sauvegardes.

- Ajoute le réglage Récupération automatique. Il reste activé par défaut ; désactivé, Tor échoue en mode fermé.
- Une adresse .onion suit désormais son service lorsque les ports de celui-ci changent.
- La clé d'une adresse .onion n'est jamais supprimée automatiquement. Une adresse qu'aucune interface n'utilise reste en place jusqu'à ce que vous la supprimiez avec Supprimer les adresses onion inutilisées, qui remplace Supprimer les adresses onion.
- Restaurer Tor avant les services qui utilisent ses adresses .onion ne supprime plus ces adresses.
- Vous pouvez ajouter vos propres options au début du fichier de configuration de Tor ; elles sont conservées.`,
  },
  migrations: {
    /**
     * Takes a volume written by any release up to 0.4.9.12:6 to the layout this
     * one reads. Each step checks its own precondition, so a run interrupted
     * part-way finishes on the next one.
     */
    up: async ({ effects }) => {
      // The legacy torrc was the database. Read the onions out of it, parked
      // ones included, then set it aside so the renderer writes a fresh one.
      // The relay directives in it are dropped with it.
      const raw = await torrcFile.read().once()
      if (raw !== null && !hasMarker(raw)) {
        const legacy = await legacyTorrc.read().once()
        const onions: Onions = present(
          await storeJson.read((s) => s.onions).once(),
        )
        for (const [packageId, hosts] of Object.entries(
          legacy?.onionServices ?? {},
        )) {
          for (const [hostId, services] of Object.entries(hosts ?? {})) {
            for (const [index, svc] of Object.entries(services ?? {})) {
              if (!svc) continue
              const ports: OnionPort[] = []
              for (const [external, p] of Object.entries(svc.ports)) {
                if (!p || isNaN(p.internalPort)) continue
                const { internalPort } = p
                // An entry can record a mode its binding never served. Follow
                // the mode it does serve, as earlier releases did on every start.
                const serves = (ssl: boolean) =>
                  sdk.host
                    .getBridgeAddress(effects, {
                      packageId,
                      hostId,
                      internalPort,
                      ssl,
                    })
                    .once()
                    .then(
                      (a) => a !== null,
                      () => false,
                    )
                const ssl =
                  !(await serves(p.ssl)) && (await serves(!p.ssl))
                    ? !p.ssl
                    : p.ssl
                ports.push({
                  externalPort: Number(external),
                  internalPort,
                  ssl,
                })
              }
              onions[onionId(packageId, hostId, index)] = { ports }
            }
          }
        }
        const store = await storeJson.read().once()
        await storeJson.write(effects, {
          ...(store ?? { automaticRecovery: true }),
          onions,
        })
        await rename(
          sdk.volumes.tor.subpath('torrc'),
          sdk.volumes.tor.subpath('torrc.legacy'),
        )
        console.info(
          `Imported ${Object.keys(onions).length} onion address(es) from the legacy torrc`,
        )
      }

      // Tor's DataDirectory moves under data/. Carry its state file and caches
      // over: starting from an empty one would re-select every server's entry
      // nodes for no reason.
      const root = sdk.volumes.tor.path
      const entries = await readdir(root).catch(() => [] as string[])
      const torData = entries.filter((e) => !NOT_TOR_DATA.includes(e))
      if (torData.length) {
        await mkdir(sdk.volumes.tor.subpath('data'), { recursive: true })
        for (const entry of torData) {
          await rename(
            sdk.volumes.tor.subpath(entry),
            sdk.volumes.tor.subpath(`data/${entry}`),
          ).catch((e) =>
            console.warn(`Left ${entry} where it was: ${String(e)}`),
          )
        }
      }
    },
    down: IMPOSSIBLE,
  },
})
