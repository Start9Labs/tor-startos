import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.17:3',
  releaseNotes: {
    en_US:
      'A .onion address is published only on ports that belong to a service interface. An address none of whose ports belongs to one is listed by Delete Unused Onion Addresses, and its key is kept until you delete it.',
    es_ES:
      'Una dirección .onion solo se publica en los puertos que pertenecen a una interfaz de servicio. Una dirección cuyos puertos no pertenecen a ninguna aparece en Eliminar direcciones onion sin usar, y su clave se conserva hasta que la elimine.',
    de_DE:
      'Eine .onion-Adresse wird nur auf Ports veröffentlicht, die zu einer Dienstschnittstelle gehören. Eine Adresse, von deren Ports keiner zu einer gehört, wird unter Nicht verwendete Onion-Adressen löschen aufgeführt, und ihr Schlüssel bleibt erhalten, bis Sie sie löschen.',
    pl_PL:
      'Adres .onion jest publikowany tylko na portach należących do interfejsu usługi. Adres, którego żaden port nie należy do interfejsu, pojawia się w akcji Usuń nieużywane adresy onion, a jego klucz zostaje zachowany, dopóki go nie usuniesz.',
    fr_FR:
      "Une adresse .onion n'est publiée que sur les ports qui appartiennent à une interface de service. Une adresse dont aucun port n'appartient à une interface figure dans Supprimer les adresses onion inutilisées, et sa clé est conservée jusqu'à ce que vous la supprimiez.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
