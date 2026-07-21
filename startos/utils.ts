import { createHash } from 'crypto'
import { utils } from '@start9labs/start-sdk'
import { ed25519 } from '@noble/curves/ed25519.js'
import { bytesToNumberLE } from '@noble/curves/utils.js'
import { base32 } from 'rfc4648'

/**
 * The SOCKS5 proxy binding. Bound without an exported interface, so it is
 * reachable only on lo/lxcbr0 — dependents dial the stable bridge address
 * `${await sdk.getOsIp(effects)}:${socksPort}` (10.0.3.1:9050), never the
 * LAN. Import these instead of hardcoding.
 */
export const socksHostId = 'socks'
export const socksPort = 9050

/**
 * The IPv4 LXC-bridge `{ hostname, port }` for the interface on a binding of an
 * already-resolved host. `<pkg>.startos` DNS and container IPs are deprecated;
 * containers — and the OS admin UI (`start-os`/`admin`) — are reached over this
 * bridge. `ssl` picks the https vs http variant. Returns `undefined` when the
 * binding exports no bridge-reachable interface. Call after `sdk.host.get(...)`
 * has resolved the host.
 */
export const bridgeHost = (
  host: utils.FilledHost | null,
  internalPort: number,
  ssl: boolean,
) => {
  const binding = host?.bindings[internalPort]
  const iface = binding && Object.values(binding.interfaces)[0]
  return iface
    ? iface.addressInfo.filter({
        kind: 'bridge',
        predicate: (h) => h.metadata.kind === 'ipv4' && h.ssl === ssl,
      }).hostnames[0]
    : undefined
}

const SECRET_KEY_HEADER = Buffer.from('== ed25519v1-secret: type0 ==\0\0\0')

function deriveOnionHostname(pubBytes: Uint8Array): string {
  const version = Buffer.from([0x03])
  const checksum = createHash('sha3-256')
    .update(Buffer.concat([Buffer.from('.onion checksum'), pubBytes, version]))
    .digest()
    .subarray(0, 2)
  return (
    base32
      .stringify(Buffer.concat([pubBytes, checksum, version]), { pad: false })
      .toLowerCase() + '.onion'
  )
}

/**
 * Check whether the first 32 bytes of an expanded ed25519 key are properly
 * clamped per RFC 8032 §5.1.5:
 *   - lowest 3 bits of byte 0 cleared
 *   - bit 255 (high bit of byte 31) cleared
 *   - bit 254 (second-high bit of byte 31) set
 */
export function isClamped(scalar: Uint8Array): boolean {
  if (scalar.length < 32) return false
  if ((scalar[0] & 7) !== 0) return false
  if ((scalar[31] & 128) !== 0) return false
  if ((scalar[31] & 64) === 0) return false
  return true
}

export function generateOnionFiles(privateKeyBase64?: string | null): {
  secretKey: Buffer
  hostname: string
} {
  if (privateKeyBase64) {
    // User-provided key: 64-byte expanded key (no header)
    const expanded = Buffer.from(privateKeyBase64, 'base64')
    const scalar = expanded.subarray(0, 32)
    // Reduce scalar mod curve order before multiplying, matching what
    // @noble/curves does internally in getExtendedPublicKey(). Clamped
    // ed25519 scalars have bit 254 set (~2^254) which exceeds the curve
    // order (~2^252), so multiply() rejects them without this reduction.
    const scalarN = bytesToNumberLE(scalar) % ed25519.Point.Fn.ORDER
    if (scalarN === BigInt(0)) {
      throw new Error('Invalid key: scalar is zero mod curve order')
    }
    const pubBytes = ed25519.Point.BASE.multiply(scalarN).toBytes()
    const secretKey = Buffer.concat([SECRET_KEY_HEADER, expanded])
    return { secretKey, hostname: deriveOnionHostname(pubBytes) }
  }

  // Auto-generate: use library for seed generation and key expansion
  const seed = ed25519.utils.randomSecretKey()
  const { head, prefix, pointBytes } = ed25519.utils.getExtendedPublicKey(seed)

  const secretKey = Buffer.concat([SECRET_KEY_HEADER, head, prefix])
  return { secretKey, hostname: deriveOnionHostname(pointBytes) }
}
