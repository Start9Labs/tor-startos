import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

/**
 * The torrc as text. Nothing is read back out of it as state:
 * `init/renderTorrc` writes it from the store, below the section the user owns.
 */
export const torrcFile = FileHelper.string({
  base: sdk.volumes.tor,
  subpath: 'torrc',
})
