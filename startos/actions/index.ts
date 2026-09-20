import { sdk } from '../sdk'
import { addOnionService } from './addOnionService'
import { deleteOnionService } from './deleteOnionService'
import { deleteOnionAddresses } from './deleteOnionAddresses'
import { configureRelay } from './configureRelay'
import { resetConnection } from './resetConnection'

export const actions = sdk.Actions.of()
  .addAction(addOnionService)
  .addAction(deleteOnionService)
  .addAction(deleteOnionAddresses)
  .addAction(configureRelay)
  .addAction(resetConnection)
