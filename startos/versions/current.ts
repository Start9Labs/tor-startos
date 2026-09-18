import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.9.12:3',
  releaseNotes: {
    en_US: `Onion addresses survive a batch restore in which Tor comes up before the service they belong to.`,
    es_ES: `Las direcciones onion sobreviven a una restauración en lote en la que Tor arranca antes que el servicio al que pertenecen.`,
    de_DE: `Onion-Adressen überstehen eine Sammelwiederherstellung, bei der Tor vor dem Dienst hochkommt, zu dem sie gehören.`,
    pl_PL: `Adresy onion przetrwają zbiorcze przywracanie, w którym Tor uruchamia się przed usługą, do której należą.`,
    fr_FR: `Les adresses onion survivent à une restauration groupée où Tor démarre avant le service auquel elles appartiennent.`,
  },
  migrations: {
    up: async ({ effects }) => {},
  },
})
