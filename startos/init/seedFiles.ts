import { torrc } from '../fileModels/torrc'
import { sdk } from '../sdk'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  await torrc.merge(effects, {})
})
