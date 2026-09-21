import {
  hsDir,
  parseOnionId,
  present,
  STORE_LOCATION,
  storeJson,
} from '../fileModels/store.json'
import { torrcFile } from '../fileModels/torrc'
import { sdk } from '../sdk'
import { render, RenderedOnion, userSection } from '../torrc/render'
import { socksPort } from '../utils'

/**
 * Renders the torrc from the store and the live bindings. A forward target is
 * resolved here and never stored, so a binding whose port moves is followed,
 * and a port with no bridge address is left out rather than pointed anywhere.
 * Each target is a `.const()`, so this re-runs when one changes.
 */
export const renderTorrc = sdk.setupOnInit(async (effects) => {
  const onions = present(await storeJson.read((s) => s.onions).const(effects))

  const rendered: RenderedOnion[] = []
  for (const [id, onion] of Object.entries(onions)) {
    const { packageId, hostId } = parseOnionId(id)
    const ports: RenderedOnion['ports'] = []
    for (const { externalPort, internalPort, ssl } of onion.ports) {
      const target = await sdk.host
        .getBridgeAddress(effects, { packageId, hostId, internalPort, ssl })
        .const()
        .catch((e) => {
          console.warn(`Not serving ${id}:${externalPort}: ${String(e)}`)
          return null
        })
      if (target !== null) ports.push({ externalPort, target })
    }
    rendered.push({ dir: hsDir(id), label: `${packageId}/${hostId}`, ports })
  }

  // Read once: the user's section is carried over, not reacted to here.
  const current = await torrcFile.read().once()
  const next = render(userSection(current), {
    root: '/var/lib/tor',
    source: STORE_LOCATION,
    socksPort,
    onions: rendered,
  })
  if (next !== current) await torrcFile.write(effects, next)
})
