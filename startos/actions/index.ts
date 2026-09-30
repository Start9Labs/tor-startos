import { sdk } from '../sdk'
import { addOnionService } from './addOnionService'
import { deleteOnionService } from './deleteOnionService'
import { deleteUnusedAddresses } from './deleteUnusedAddresses'
import { resetConnection } from './resetConnection'
import { automaticRecovery } from './automaticRecovery'

export const actions = sdk.Actions.of()
  .addAction(addOnionService)
  .addAction(deleteOnionService)
  .addAction(deleteUnusedAddresses)
  .addAction(resetConnection)
  .addAction(automaticRecovery)
