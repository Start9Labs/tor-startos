import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.11:8',
  releaseNotes: {
    en_US: `Fixes relay and bridge mode: the OR port was never offered a public address, so the relay could not be reached from the internet and never joined the Tor network. After updating, open the Tor Relay OR Port interface and enable the Public address on the same connection Tor uses for outbound traffic — the instructions walk through it.`,
    es_ES: `Corrige el modo de repetidor y puente: al puerto OR nunca se le ofrecía una dirección pública, por lo que el repetidor no podía ser alcanzado desde internet y nunca se unía a la red Tor. Tras actualizar, abra la interfaz Tor Relay OR Port y habilite la dirección pública en la misma conexión que Tor usa para el tráfico saliente; las instrucciones detallan los pasos.`,
    de_DE: `Behebt den Relay- und Bridge-Modus: dem OR-Port wurde nie eine öffentliche Adresse angeboten, sodass das Relay aus dem Internet nicht erreichbar war und dem Tor-Netzwerk nie beigetreten ist. Öffnen Sie nach dem Update die Schnittstelle Tor Relay OR Port und aktivieren Sie die öffentliche Adresse auf derselben Verbindung, die Tor für ausgehenden Verkehr nutzt; die Anleitung beschreibt die Schritte.`,
    pl_PL: `Naprawia tryb przekaźnika i mostka: portowi OR nigdy nie oferowano adresu publicznego, więc przekaźnik nie był osiągalny z internetu i nigdy nie dołączał do sieci Tor. Po aktualizacji otwórz interfejs Tor Relay OR Port i włącz adres publiczny na tym samym połączeniu, którego Tor używa dla ruchu wychodzącego; instrukcja opisuje kolejne kroki.`,
    fr_FR: `Corrige le mode relais et pont : le port OR ne se voyait jamais proposer d'adresse publique, le relais ne pouvait donc pas être joint depuis internet et ne rejoignait jamais le réseau Tor. Après la mise à jour, ouvrez l'interface Tor Relay OR Port et activez l'adresse publique sur la même connexion que Tor utilise pour le trafic sortant ; les instructions détaillent la marche à suivre.`,
  },
  migrations: {},
})
