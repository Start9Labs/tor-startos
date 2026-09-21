import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.12:7',
  releaseNotes: {
    en_US: `A \`.onion\` address attached to a port its service no longer declares is parked, and Delete Onion Addresses shows every address's port. When adding a Tor address to an interface, a parked address of that service can be chosen, which moves it to that interface.`,
    es_ES: `Una dirección \`.onion\` vinculada a un puerto que su servicio ya no declara queda aparcada, y Eliminar direcciones onion muestra el puerto de cada dirección. Al añadir una dirección Tor a una interfaz se puede elegir una dirección aparcada de ese servicio, lo que la traslada a esa interfaz.`,
    de_DE: `Eine \`.onion\`-Adresse, die an einem Port hängt, den ihr Dienst nicht mehr deklariert, wird geparkt, und Onion-Adressen löschen zeigt zu jeder Adresse den Port. Beim Hinzufügen einer Tor-Adresse zu einer Schnittstelle kann eine geparkte Adresse dieses Dienstes gewählt werden, wodurch sie auf diese Schnittstelle umzieht.`,
    pl_PL: `Adres \`.onion\` przypisany do portu, którego jego usługa już nie deklaruje, zostaje zaparkowany, a Usuń adresy onion pokazuje port każdego adresu. Przy dodawaniu adresu Tor do interfejsu można wybrać zaparkowany adres tej usługi, co przenosi go na ten interfejs.`,
    fr_FR: `Une adresse \`.onion\` rattachée à un port que son service ne déclare plus est mise en attente, et Supprimer les adresses onion affiche le port de chaque adresse. Lors de l'ajout d'une adresse Tor à une interface, une adresse en attente de ce service peut être choisie, ce qui la déplace vers cette interface.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
