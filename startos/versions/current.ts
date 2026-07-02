import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.11:1',
  releaseNotes: {
    en_US: `The StartOS admin UI is now handled like any other service (requires StartOS 0.4.0-beta.10, which renames the existing entry and preserves your .onion address). Cleanup of stale onion entries is now more careful: an entry is only removed when its service confirmably no longer exists.`,
    es_ES: `La interfaz de administración de StartOS ahora se gestiona como cualquier otro servicio (requiere StartOS 0.4.0-beta.10, que renombra la entrada existente y conserva su dirección .onion). La limpieza de entradas onion obsoletas ahora es más cuidadosa: una entrada solo se elimina cuando se confirma que su servicio ya no existe.`,
    de_DE: `Die StartOS-Verwaltungsoberfläche wird jetzt wie jeder andere Dienst behandelt (erfordert StartOS 0.4.0-beta.10, das den bestehenden Eintrag umbenennt und Ihre .onion-Adresse erhält). Die Bereinigung veralteter Onion-Einträge ist jetzt vorsichtiger: Ein Eintrag wird nur entfernt, wenn sein Dienst nachweislich nicht mehr existiert.`,
    pl_PL: `Interfejs administracyjny StartOS jest teraz obsługiwany jak każda inna usługa (wymaga StartOS 0.4.0-beta.10, który zmienia nazwę istniejącego wpisu i zachowuje Twój adres .onion). Czyszczenie nieaktualnych wpisów onion jest teraz ostrożniejsze: wpis jest usuwany tylko wtedy, gdy potwierdzono, że jego usługa już nie istnieje.`,
    fr_FR: `L'interface d'administration de StartOS est désormais gérée comme n'importe quel autre service (nécessite StartOS 0.4.0-beta.10, qui renomme l'entrée existante et préserve votre adresse .onion). Le nettoyage des entrées onion obsolètes est désormais plus prudent : une entrée n'est supprimée que lorsqu'il est confirmé que son service n'existe plus.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
