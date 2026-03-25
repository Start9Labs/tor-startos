import { VersionInfo } from '@start9labs/start-sdk'

export const v_0_4_9_5_0_b6 = VersionInfo.of({
  version: '0.4.9.5:0-beta.6',
  releaseNotes: {
    en_US: 'Fix SSL onion addresses not being created for StartOS UI',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
