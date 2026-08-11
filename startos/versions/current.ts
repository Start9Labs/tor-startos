import { mkdir, rename, rmdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { hsDir, nextKey, torrc } from '../fileModels/torrc'
import { sdk } from '../sdk'

const LEGACY_ID = 'STARTOS'

export const current = VersionInfo.of({
  version: '0.4.9.11:6',
  releaseNotes: {
    en_US: `- Adds a Reset Tor Connection action for when Tor gets stuck on a bad entry node. Restarting the service does not fix this on its own, because the entry node it picked is saved to disk and chosen again on the next start.
- Tor now recovers from this by itself: it switches entry nodes, and clears its saved network data and restarts if that isn't enough. Your .onion addresses are never affected.
- Tor now reports a failure when it has connected but cannot build circuits, instead of reporting that it is running.
- Repairs servers left with a legacy STARTOS onion entry, which stopped Tor from starting and so blocked the very update that fixes it. The StartOS UI's .onion address is carried over to its current identity rather than regenerated.`,
    es_ES: `- Añade una acción Restablecer la conexión de Tor para cuando Tor se queda atascado en un nodo de entrada defectuoso. Reiniciar el servicio no lo soluciona por sí solo, porque el nodo de entrada elegido se guarda en disco y se vuelve a elegir en el siguiente arranque.
- Tor ahora se recupera de esto por sí mismo: cambia de nodos de entrada y, si eso no basta, borra sus datos de red guardados y se reinicia. Sus direcciones .onion nunca se ven afectadas.
- Tor ahora informa de un fallo cuando se ha conectado pero no puede construir circuitos, en lugar de informar de que está funcionando.
- Repara los servidores que quedaron con una entrada onion heredada STARTOS, que impedía iniciar Tor y por tanto bloqueaba la propia actualización que lo corrige. La dirección .onion de la interfaz de StartOS se conserva en su identidad actual en lugar de regenerarse.`,
    de_DE: `- Fügt die Aktion „Tor-Verbindung zurücksetzen“ hinzu, für den Fall, dass Tor an einem defekten Eingangsknoten hängen bleibt. Ein Neustart des Dienstes behebt das allein nicht, da der gewählte Eingangsknoten auf der Festplatte gespeichert und beim nächsten Start erneut gewählt wird.
- Tor erholt sich davon jetzt selbst: Es wechselt die Eingangsknoten und löscht, falls das nicht reicht, seine gespeicherten Netzwerkdaten und startet neu. Ihre .onion-Adressen sind nie betroffen.
- Tor meldet jetzt einen Fehler, wenn es verbunden ist, aber keine Kanäle aufbauen kann, statt zu melden, dass es läuft.
- Repariert Server mit einem alten STARTOS-Onion-Eintrag, der den Start von Tor verhinderte und damit genau das Update blockierte, das ihn behebt. Die .onion-Adresse der StartOS-Oberfläche wird auf ihre aktuelle Identität übernommen statt neu erzeugt.`,
    pl_PL: `- Dodaje akcję Zresetuj połączenie Tor na wypadek, gdy Tor utknie na wadliwym węźle wejściowym. Ponowne uruchomienie usługi samo w sobie tego nie naprawia, ponieważ wybrany węzeł wejściowy jest zapisany na dysku i wybierany ponownie przy następnym starcie.
- Tor sam się teraz z tego podnosi: zmienia węzły wejściowe, a jeśli to nie wystarczy, czyści zapisane dane sieci i uruchamia się ponownie. Twoje adresy .onion nigdy nie są naruszane.
- Tor zgłasza teraz błąd, gdy jest połączony, ale nie może budować obwodów, zamiast informować, że działa.
- Naprawia serwery z przestarzałym wpisem onion STARTOS, który uniemożliwiał uruchomienie Tora, a przez to blokował tę samą aktualizację, która go naprawia. Adres .onion interfejsu StartOS zostaje przeniesiony na jego obecną tożsamość zamiast zostać wygenerowany na nowo.`,
    fr_FR: `- Ajoute une action Réinitialiser la connexion Tor pour les cas où Tor reste bloqué sur un nœud d'entrée défaillant. Redémarrer le service ne suffit pas, car le nœud d'entrée choisi est enregistré sur le disque et rechoisi au démarrage suivant.
- Tor s'en remet désormais tout seul : il change de nœuds d'entrée et, si cela ne suffit pas, efface ses données réseau enregistrées et redémarre. Vos adresses .onion ne sont jamais affectées.
- Tor signale maintenant un échec lorsqu'il est connecté mais ne peut pas construire de circuits, au lieu d'indiquer qu'il fonctionne.
- Répare les serveurs conservant une ancienne entrée onion STARTOS, qui empêchait Tor de démarrer et bloquait donc la mise à jour même qui la corrige. L'adresse .onion de l'interface StartOS est reprise sous son identité actuelle au lieu d'être régénérée.`,
  },
  migrations: {
    /**
     * Re-points onion entries left behind by the beta-era StartOS UI sentinel.
     *
     * StartOS 0.4.0-beta.10 migrates `STARTOS`/`startos-ui` to
     * `start-os`/`admin` itself, but by literal string match, so an entry whose
     * host id came through as anything else — `undefined`, from an
     * onion-migration.json record that carried no hostId — was left behind.
     * `STARTOS` is not a valid package id, and every init feeds it to
     * `clearUrls`, which rejects the whole call and stops the service finishing
     * its start. The update that fixes it can then never land, which is why this
     * is a migration rather than a guard in the export path.
     */
    up: async ({ effects }) => {
      const config = await torrc.read().once()
      const onionServices = structuredClone(config?.onionServices ?? {})
      const legacy = onionServices[LEGACY_ID]
      if (!legacy) return

      // Adopt the legacy address as the admin UI's only when there isn't one
      // already — a stale duplicate must never displace the address the UI is
      // currently reachable at.
      const admin = onionServices['start-os']?.['admin'] ?? {}
      if (!Object.keys(admin).length) {
        for (const [hostId, services] of Object.entries(legacy)) {
          for (const [index, svc] of Object.entries(services ?? {})) {
            if (!svc) continue
            const key = nextKey(admin)
            const to = sdk.volumes.tor.subpath(hsDir('start-os', 'admin', key))
            try {
              await mkdir(dirname(to), { recursive: true })
              await rename(
                sdk.volumes.tor.subpath(hsDir(LEGACY_ID, hostId, index)),
                to,
              )
            } catch (e) {
              // No key material behind the entry, so there is no address to
              // carry over — drop it rather than publish one that can't resolve.
              console.warn(
                `Dropping legacy ${LEGACY_ID}/${hostId} onion: ${String(e)}`,
              )
              continue
            }
            admin[key] = svc
          }
        }
        if (Object.keys(admin).length) {
          onionServices['start-os'] = { ...onionServices['start-os'], admin }
          console.info(
            `Adopted legacy ${LEGACY_ID} onion address as start-os/admin`,
          )
        }
      }

      // Set to undefined (not delete) so merge() removes the key from the file
      ;(onionServices as any)[LEGACY_ID] = undefined
      await torrc.merge(effects, { onionServices })

      // Non-recursive on purpose: these succeed only once the renames emptied
      // them. Where the address was not adopted its key material is still here,
      // and ENOTEMPTY is what leaves it alone rather than deleting it.
      for (const hostId of Object.keys(legacy)) {
        await rmdir(
          sdk.volumes.tor.subpath(`hidden_services/${LEGACY_ID}/${hostId}`),
        ).catch(() => {})
      }
      await rmdir(
        sdk.volumes.tor.subpath(`hidden_services/${LEGACY_ID}`),
      ).catch(() => {})
    },
    down: IMPOSSIBLE,
  },
})
