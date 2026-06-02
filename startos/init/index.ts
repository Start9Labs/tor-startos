import { actions } from '../actions'
import { restoreInit } from '../backups'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { exportUrls, registerUrlPlugin } from '../plugin/url'
import { sdk } from '../sdk'
import { versionGraph } from '../versions'
import { fixOnionTargets } from './fixOnionTargets'
import { migrateOnionAddresses } from './migrateOnionAddresses'
import { reloadTorrc } from './reloadTorrc'
import { seedFiles } from './seedFiles'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedFiles,
  setInterfaces,
  setDependencies,
  actions,
  registerUrlPlugin,
  migrateOnionAddresses,
  fixOnionTargets,
  exportUrls,
  reloadTorrc,
)

export const uninit = sdk.setupUninit(versionGraph)
