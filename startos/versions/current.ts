import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.12:5',
  releaseNotes: {
    en_US: `A new Delete Onion Addresses action in Tor's Actions lists every .onion address the server hosts, including addresses no longer attached to a service's interface, and deletes the ones you choose.`,
    es_ES: `Una nueva acción, Eliminar direcciones onion, en las Acciones de Tor muestra todas las direcciones .onion que aloja el servidor, incluidas las que ya no están vinculadas a la interfaz de ningún servicio, y elimina las que elija.`,
    de_DE: `Eine neue Aktion „Onion-Adressen löschen“ unter Tors Aktionen listet jede .onion-Adresse auf, die der Server hostet, auch Adressen, die keiner Schnittstelle eines Dienstes mehr zugeordnet sind, und löscht die von Ihnen gewählten.`,
    pl_PL: `Nowa akcja Usuń adresy onion w Akcjach Tora wyświetla każdy adres .onion hostowany na serwerze, w tym adresy nieprzypisane już do interfejsu żadnej usługi, i usuwa wybrane przez Ciebie.`,
    fr_FR: `Une nouvelle action Supprimer les adresses onion, dans les Actions de Tor, liste chaque adresse .onion hébergée par le serveur, y compris celles qui ne sont plus rattachées à l'interface d'un service, et supprime celles que vous choisissez.`,
  },
  migrations: {
    up: async ({ effects }) => {},
  },
})
