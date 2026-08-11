import { mkdir, rename, rmdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { hsDir, nextKey, torrc } from '../fileModels/torrc'
import { sdk } from '../sdk'

const LEGACY_ID = 'STARTOS'

export const current = VersionInfo.of({
  version: '0.4.9.11:6',
  releaseNotes: {
    en_US: `- Fixes an issue where the Tor service could get stuck at high CPU usage, causing onion address changes to time out.
- The Add Onion Service dialog now lists an existing .onion address only when the selected interface still has a binding it isn't already attached to (non-SSL, plus SSL when available).
- Repairs servers left with a legacy STARTOS onion entry, which stopped Tor from starting and so blocked the very update that fixes it. The StartOS UI's .onion address is carried over to its current identity rather than regenerated.`,
    es_ES: `- Corrige un problema por el que el servicio Tor podía quedarse con un uso elevado de CPU, provocando que los cambios de direcciones onion agotaran el tiempo de espera.
- El diálogo Agregar servicio onion ahora muestra una dirección .onion existente solo cuando la interfaz seleccionada aún tiene un enlace al que no está asociada (no SSL, y SSL cuando esté disponible).
- Repara los servidores que quedaron con una entrada onion heredada STARTOS, que impedía iniciar Tor y por tanto bloqueaba la propia actualización que lo corrige. La dirección .onion de la interfaz de StartOS se conserva en su identidad actual en lugar de regenerarse.`,
    de_DE: `- Behebt ein Problem, bei dem der Tor-Dienst bei hoher CPU-Auslastung hängen bleiben konnte, wodurch Änderungen an Onion-Adressen eine Zeitüberschreitung verursachten.
- Der Dialog „Onion-Dienst hinzufügen“ zeigt eine vorhandene .onion-Adresse jetzt nur an, wenn die ausgewählte Schnittstelle noch eine Bindung hat, an die sie nicht bereits angehängt ist (Nicht-SSL sowie SSL, sofern verfügbar).
- Repariert Server mit einem alten STARTOS-Onion-Eintrag, der den Start von Tor verhinderte und damit genau das Update blockierte, das ihn behebt. Die .onion-Adresse der StartOS-Oberfläche wird auf ihre aktuelle Identität übernommen statt neu erzeugt.`,
    pl_PL: `- Naprawia problem, w którym usługa Tor mogła utknąć przy wysokim zużyciu procesora, powodując przekroczenie limitu czasu przy zmianach adresów onion.
- Okno „Dodaj usługę onion“ pokazuje teraz istniejący adres .onion tylko wtedy, gdy wybrany interfejs ma jeszcze powiązanie, do którego adres nie jest już przypisany (bez SSL oraz SSL, jeśli jest dostępne).
- Naprawia serwery z przestarzałym wpisem onion STARTOS, który uniemożliwiał uruchomienie Tora, a przez to blokował tę samą aktualizację, która go naprawia. Adres .onion interfejsu StartOS zostaje przeniesiony na jego obecną tożsamość zamiast zostać wygenerowany na nowo.`,
    fr_FR: `- Corrige un problème où le service Tor pouvait rester bloqué à une utilisation élevée du processeur, provoquant l'expiration des modifications d'adresses onion.
- La boîte de dialogue « Ajouter un service onion » n'affiche désormais une adresse .onion existante que si l'interface sélectionnée possède encore une liaison à laquelle elle n'est pas déjà rattachée (sans SSL, et SSL lorsqu'il est disponible).
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
