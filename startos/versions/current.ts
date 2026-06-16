import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.9:2',
  releaseNotes: {
    en_US: `**Fixes**

- Fixed onion-service creation for SSL-native interfaces (those that terminate their own TLS, e.g. SimpleX SMP/XFTP and Core Lightning's gRPC), which wrongly failed with "…its interface is SSL-only. Create an SSL onion service instead." The onion now forwards straight to the service's own TLS port.`,
    es_ES: `**Correcciones**

- Se corrigió la creación de servicios onion para interfaces nativas de SSL (las que terminan su propio TLS, p. ej. SMP/XFTP de SimpleX y el gRPC de Core Lightning), que fallaba por error con «…su interfaz es solo SSL. Cree un servicio onion SSL en su lugar.» Ahora el onion reenvía directamente al puerto TLS del propio servicio.`,
    de_DE: `**Korrekturen**

- Onion-Dienst-Erstellung für SSL-native Schnittstellen behoben (die ihr eigenes TLS terminieren, z. B. SimpleX SMP/XFTP und das gRPC von Core Lightning); diese schlug fälschlicherweise mit „…ihre Schnittstelle ist ausschließlich SSL. Erstellen Sie stattdessen einen SSL-Onion-Dienst." fehl. Der Onion leitet nun direkt an den TLS-Port des Dienstes weiter.`,
    pl_PL: `**Poprawki**

- Naprawiono tworzenie usług onion dla interfejsów natywnie obsługujących SSL (tych, które same kończą TLS, np. SMP/XFTP SimpleX oraz gRPC Core Lightning), które błędnie kończyło się komunikatem „…ten interfejs obsługuje wyłącznie SSL. Utwórz usługę onion z SSL." Onion przekazuje teraz ruch bezpośrednio do portu TLS samej usługi.`,
    fr_FR: `**Corrections**

- Correction de la création de services onion pour les interfaces nativement SSL (celles qui terminent leur propre TLS, p. ex. SMP/XFTP de SimpleX et le gRPC de Core Lightning), qui échouait à tort avec « …son interface est exclusivement SSL. Créez plutôt un service onion SSL. » L'onion redirige désormais directement vers le port TLS du service lui-même.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
