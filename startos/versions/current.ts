import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.11:7',
  releaseNotes: {
    en_US: `- Repairs Tor addresses that stopped answering after the service they point at changed the ports or the encryption it is served on. They are re-pointed the next time Tor starts, and your .onion addresses are unchanged.
- When you add a Tor address for a service reachable only over SSL, the SSL toggle now starts on instead of off. Web interfaces still start off, since Tor already secures the connection.`,
    es_ES: `- Repara las direcciones Tor que dejaron de responder después de que el servicio al que apuntan cambiara los puertos o el cifrado con que se sirve. Se vuelven a apuntar la próxima vez que se inicie Tor, y sus direcciones .onion no cambian.
- Al añadir una dirección Tor para un servicio accesible solo por SSL, el interruptor SSL ahora empieza encendido en lugar de apagado. Las interfaces web siguen empezando apagadas, ya que Tor ya protege la conexión.`,
    de_DE: `- Repariert Tor-Adressen, die nicht mehr antworteten, nachdem der Dienst, auf den sie zeigen, die Ports oder die Verschlüsselung gewechselt hat, über die er bereitgestellt wird. Sie werden beim nächsten Start von Tor neu ausgerichtet; Ihre .onion-Adressen bleiben unverändert.
- Beim Hinzufügen einer Tor-Adresse für einen Dienst, der nur über SSL erreichbar ist, steht der SSL-Schalter jetzt anfangs auf ein statt auf aus. Weboberflächen starten weiterhin ausgeschaltet, da Tor die Verbindung bereits absichert.`,
    pl_PL: `- Naprawia adresy Tor, które przestały odpowiadać po tym, jak usługa, na którą wskazują, zmieniła porty lub szyfrowanie, na których jest udostępniana. Zostaną przekierowane przy następnym uruchomieniu Tora, a Twoje adresy .onion pozostają bez zmian.
- Przy dodawaniu adresu Tor dla usługi dostępnej wyłącznie przez SSL przełącznik SSL zaczyna teraz włączony zamiast wyłączony. Interfejsy internetowe nadal zaczynają wyłączone, ponieważ Tor już zabezpiecza połączenie.`,
    fr_FR: `- Répare les adresses Tor qui ne répondaient plus après que le service vers lequel elles pointent a changé les ports ou le chiffrement avec lesquels il est servi. Elles sont redirigées au prochain démarrage de Tor, et vos adresses .onion restent inchangées.
- Lorsque vous ajoutez une adresse Tor pour un service accessible uniquement via SSL, le commutateur SSL démarre désormais activé au lieu de désactivé. Les interfaces web démarrent toujours désactivées, car Tor sécurise déjà la connexion.`,
  },
  migrations: {},
})
