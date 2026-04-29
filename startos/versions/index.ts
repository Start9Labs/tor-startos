import { VersionGraph } from '@start9labs/start-sdk'
import { v_0_4_9_5_1 } from './v0.4.9.5.1'
import { v_0_4_9_5_2 } from './v0.4.9.5.2'

export const versionGraph = VersionGraph.of({
  current: v_0_4_9_5_2,
  other: [v_0_4_9_5_1],
})
