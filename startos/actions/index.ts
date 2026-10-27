import { sdk } from '../sdk'
import { addOnionService } from './addOnionService'
import { connectViaBridges } from './connectViaBridges'
import { deleteOnionService } from './deleteOnionService'
import { deleteUnusedAddresses } from './deleteUnusedAddresses'
import { resetConnection } from './resetConnection'
import { automaticRecovery } from './automaticRecovery'
import { stopUsingBridges } from './stopUsingBridges'

export const actions = sdk.Actions.of()
  .addAction(addOnionService)
  .addAction(deleteOnionService)
  .addAction(deleteUnusedAddresses)
  .addAction(resetConnection)
  .addAction(automaticRecovery)
  .addAction(connectViaBridges)
  .addAction(stopUsingBridges)
