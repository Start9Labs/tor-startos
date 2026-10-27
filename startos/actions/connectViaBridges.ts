import { isIP } from 'node:net'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { TRANSPORTS } from '../torrc/render'

const { InputSpec, Value } = sdk

const space = String.raw`[^\S\n]+`
const address = String.raw`(?:\d{1,3}(?:\.\d{1,3}){3}|\[[\dA-Fa-f:.]+\]):\d{1,5}`
// What torrc and Tor's 510-byte argument limit both take as written.
const argument = String.raw`[\w.-]+=[^\x00-\x20"#;\\\x7F-\uFFFF]*`
const line = String.raw`(?:${TRANSPORTS.join('|')})${space}${address}${space}[\dA-Fa-f]{40}(?:${space}${argument})*`

const inputSpec = InputSpec.of({
  bridges: Value.textarea({
    name: i18n('Bridges'),
    description: i18n(
      'Paste your bridges one per line, exactly as bridges.torproject.org or Tor Browser gives them. obfs4, WebTunnel and Snowflake bridges work.',
    ),
    required: true,
    default: null,
    patterns: [
      {
        regex: String.raw`\s*${line}(?:\s*\n\s*${line})*\s*`,
        description: i18n(
          'Each line must be a whole bridge line that begins with obfs4, webtunnel or snowflake',
        ),
      },
    ],
  }),
})

/** Tor refuses to start on a bridge line that fails this. */
function torAccepts(bridge: string) {
  const [, addr, , ...args] = bridge.split(' ')
  const at = addr.lastIndexOf(':')
  const v6 = addr.startsWith('[')
  const port = Number(addr.slice(at + 1))
  return (
    isIP(v6 ? addr.slice(1, at - 1) : addr.slice(0, at)) === (v6 ? 6 : 4) &&
    port >= 1 &&
    port <= 65535 &&
    args.join(';').length <= 510
  )
}

export const connectViaBridges = sdk.Action.withInput(
  // id
  'connect-via-bridges',

  // metadata
  async () => ({
    name: i18n('Connect via Bridges'),
    description: i18n(
      'Reach the Tor network through bridges where it is blocked, or to hide from your internet provider that this server uses Tor',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // input spec
  inputSpec,

  // pre-fill
  async () => {
    const bridges = await storeJson.read((s) => s.bridges).once()
    return bridges?.length ? { bridges: bridges.join('\n') } : null
  },

  // execution
  async ({ effects, input }) => {
    const bridges = [
      ...new Set(
        input.bridges
          .split('\n')
          .map((l) => l.trim().split(/\s+/).join(' '))
          .filter(Boolean),
      ),
    ]
    if (!bridges.length) throw new Error(i18n('Paste at least one bridge line'))
    const refused = bridges.find((b) => !torAccepts(b))
    if (refused)
      throw new Error(`${i18n('Tor cannot use this bridge line:')} ${refused}`)

    await storeJson.merge(effects, { bridges })

    return {
      version: '1',
      title: i18n('Connecting via Bridges'),
      message: i18n(
        'Tor reconnects through these bridges, which can take a few minutes. If its health check stays stuck, try other bridges.',
      ),
      result: null,
    }
  },
)
