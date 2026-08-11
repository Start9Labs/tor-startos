import { sdk } from '../sdk'
import { addOnionService } from './addOnionService'
import { deleteOnionService } from './deleteOnionService'
import { configureRelay } from './configureRelay'
import { resetConnection } from './resetConnection'

export const actions = sdk.Actions.of()
  .addAction(addOnionService)
  .addAction(deleteOnionService)
  .addAction(configureRelay)
  .addAction(resetConnection)
