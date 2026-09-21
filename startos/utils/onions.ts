import { T } from '@start9labs/start-sdk'
import { hsDir, Onion, parseOnionId } from '../fileModels/store.json'
import { sdk } from '../sdk'

/** The address's .onion hostname, or null before its key is written. */
export const onionHostname = (id: string) =>
  sdk.volumes.tor
    .readFile(`${hsDir(id)}/hostname`)
    .then((content) => content.toString().trim())
    .catch(() => null)

/** Whether any port of the address has somewhere to forward to right now. */
export async function isServed(effects: T.Effects, id: string, onion: Onion) {
  const { packageId, hostId } = parseOnionId(id)
  for (const { internalPort, ssl } of onion.ports) {
    const target = await sdk.host
      .getBridgeAddress(effects, { packageId, hostId, internalPort, ssl })
      .once()
      .catch(() => null)
    if (target !== null) return true
  }
  return false
}
