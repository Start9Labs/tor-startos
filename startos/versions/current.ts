import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.11:3',
  releaseNotes: {
    en_US: `The Add Onion Service dialog now lists an existing .onion address only when the selected interface still has a binding it isn't already attached to (non-SSL, plus SSL when available).`,
    es_ES: `El diálogo Agregar servicio onion ahora muestra una dirección .onion existente solo cuando la interfaz seleccionada aún tiene un enlace al que no está asociada (no SSL, y SSL cuando esté disponible).`,
    de_DE: `Der Dialog „Onion-Dienst hinzufügen“ zeigt eine vorhandene .onion-Adresse jetzt nur an, wenn die ausgewählte Schnittstelle noch eine Bindung hat, an die sie nicht bereits angehängt ist (Nicht-SSL sowie SSL, sofern verfügbar).`,
    pl_PL: `Okno „Dodaj usługę onion“ pokazuje teraz istniejący adres .onion tylko wtedy, gdy wybrany interfejs ma jeszcze powiązanie, do którego adres nie jest już przypisany (bez SSL oraz SSL, jeśli jest dostępne).`,
    fr_FR: `La boîte de dialogue « Ajouter un service onion » n'affiche désormais une adresse .onion existante que si l'interface sélectionnée possède encore une liaison à laquelle elle n'est pas déjà rattachée (sans SSL, et SSL lorsqu'il est disponible).`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
