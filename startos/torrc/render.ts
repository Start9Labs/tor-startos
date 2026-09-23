/**
 * The first line of the marker. A torrc is split on the first line that starts
 * with this, so the wording after it can change without orphaning a user's
 * section.
 */
const MARKER_PREFIX = '# ===== Everything below this line is generated'

/** An onion service whose forward targets are already resolved. */
export type RenderedOnion = {
  /** Path of the HiddenServiceDir, relative to the torrc's directory. */
  dir: string
  /** `package/host`, written as a comment above the block. */
  label: string
  ports: { externalPort: number; target: string }[]
}

export type RenderInput = {
  /** Absolute path, inside the container, of the directory holding the torrc. */
  root: string
  /** Where the generated section comes from, named in the marker. */
  source: string
  socksPort: number
  onions: RenderedOnion[]
}

const USER_SECTION_HEADER = [
  '# Tor configuration for this StartOS server.',
  '#',
  '# Lines you add in this top section are kept, and Tor honors them.',
  '',
].join('\n')

const marker = (source: string) =>
  [
    `${MARKER_PREFIX} from ${source}`,
    '# and is rewritten whenever that file or a service port changes. Edits made',
    '# below this line are lost. Add or remove a .onion address from the',
    "# service's interface page in StartOS. Lines above this line are yours.",
  ].join('\n')

/** The part of a torrc above the marker, or the whole file if it has none. */
export function userSection(raw: string | null): string {
  if (raw === null) return USER_SECTION_HEADER
  const lines = raw.split('\n')
  const at = lines.findIndex((l) => l.startsWith(MARKER_PREFIX))
  return at === -1 ? raw : lines.slice(0, at).join('\n')
}

export function hasMarker(raw: string): boolean {
  return raw.split('\n').some((l) => l.startsWith(MARKER_PREFIX))
}

/**
 * Renders a torrc: the user's section verbatim, then the marker, then the
 * generated section. An onion with no port to forward to is left out.
 */
export function render(user: string, input: RenderInput): string {
  const out = [
    user.replace(/\n*$/, ''),
    '',
    marker(input.source),
    '',
    `SocksPort 0.0.0.0:${input.socksPort}`,
    `DataDirectory ${input.root}/data`,
    `ControlSocket ${input.root}/control.sock`,
  ]
  for (const onion of input.onions) {
    if (onion.ports.length === 0) continue
    out.push('', `# ${onion.label}`)
    out.push(`HiddenServiceDir ${input.root}/${onion.dir}/`)
    for (const { externalPort, target } of onion.ports) {
      out.push(`HiddenServicePort ${externalPort} ${target}`)
    }
  }
  return out.join('\n') + '\n'
}
