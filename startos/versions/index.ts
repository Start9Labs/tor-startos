import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_0_4_9_11_6 } from './v0.4.9.11_6'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_0_4_9_11_6],
})
