import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.11:7',
  releaseNotes: {
    en_US: `- Repairs Tor addresses that stopped answering after the service they point at changed the ports it is served on. They are re-pointed the next time Tor starts, and your .onion addresses are unchanged.
- When you add a Tor address, the SSL toggle now starts in the same mode as the rest of that interface's addresses instead of always starting off.`,
    es_ES: `- Repara las direcciones Tor que dejaron de responder después de que el servicio al que apuntan cambiara los puertos en los que se sirve. Se vuelven a apuntar la próxima vez que se inicie Tor, y sus direcciones .onion no cambian.
- Al añadir una dirección Tor, el interruptor SSL ahora empieza en el mismo modo que el resto de las direcciones de esa interfaz, en lugar de empezar siempre apagado.`,
    de_DE: `- Repariert Tor-Adressen, die nicht mehr antworteten, nachdem der Dienst, auf den sie zeigen, die Ports gewechselt hat, über die er bereitgestellt wird. Sie werden beim nächsten Start von Tor neu ausgerichtet; Ihre .onion-Adressen bleiben unverändert.
- Beim Hinzufügen einer Tor-Adresse steht der SSL-Schalter jetzt anfangs im selben Modus wie die übrigen Adressen dieser Schnittstelle, statt immer ausgeschaltet zu starten.`,
    pl_PL: `- Naprawia adresy Tor, które przestały odpowiadać po tym, jak usługa, na którą wskazują, zmieniła porty, na których jest udostępniana. Zostaną przekierowane przy następnym uruchomieniu Tora, a Twoje adresy .onion pozostają bez zmian.
- Przy dodawaniu adresu Tor przełącznik SSL zaczyna teraz w tym samym trybie co pozostałe adresy tego interfejsu, zamiast zawsze zaczynać wyłączony.`,
    fr_FR: `- Répare les adresses Tor qui ne répondaient plus après que le service vers lequel elles pointent a changé les ports sur lesquels il est servi. Elles sont redirigées au prochain démarrage de Tor, et vos adresses .onion restent inchangées.
- Lorsque vous ajoutez une adresse Tor, le commutateur SSL démarre désormais dans le même mode que les autres adresses de cette interface, au lieu de démarrer toujours désactivé.`,
  },
  migrations: {},
})
