import { hsDir, nextKey, torrc } from '../fileModels/torrc'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { bridgeHost, generateOnionFiles } from '../utils'

const { InputSpec, Value, Variants } = sdk

const privateKeySpec = InputSpec.of({
  privateKey: Value.text({
    name: i18n('Private Key (optional)'),
    description: i18n(
      'Base64-encoded ed25519 expanded private key for a vanity .onion address. Leave blank to auto-generate.',
    ),
    required: false,
    default: null,
    placeholder: null,
    patterns: [
      {
        regex: '^[A-Za-z0-9+/]+=*$',
        description: 'Must be a valid base64 string',
      },
    ],
    masked: true,
    inputmode: 'text',
    minLength: 88,
    maxLength: 88,
  }),
})

type UrlPluginMetadata = {
  packageId: string
  interfaceId: string
  hostId: string
  internalPort: number
}

const inputSpec = InputSpec.of({
  urlPluginMetadata: Value.hidden<UrlPluginMetadata>(),
})
  .add(({ Value }) => ({
    ssl: Value.dynamicToggle(async ({ effects, prefill }) => {
      const { packageId, hostId, interfaceId, internalPort } =
        prefill?.urlPluginMetadata ?? {}
      const binding =
        packageId && hostId && internalPort != null
          ? await sdk.host
              .get(
                effects,
                { hostId, packageId },
                (host) => host?.bindings[internalPort] ?? null,
              )
              .once()
          : null
      const secure = binding?.options.secure ?? null
      const servesOwnTls = secure?.ssl === true
      // Tor authenticates the address itself, so a certificate on a UI's onion
      // buys a browser warning and nothing else.
      const isUi =
        !!interfaceId && binding?.interfaces[interfaceId]?.type === 'ui'
      return {
        name: i18n('SSL'),
        description: i18n('Serve this address with SSL'),
        default: servesOwnTls || (!isUi && secure === null),
      }
    }),
  }))
  .add(({ Value }) => ({
    address: Value.dynamicUnion(async ({ effects, prefill }) => {
      const { packageId, hostId, internalPort } =
        prefill?.urlPluginMetadata ?? {}

      const config = await torrc.read().once()
      const entries =
        (packageId && hostId && config?.onionServices?.[packageId]?.[hostId]) ||
        {}

      // Which onion bindings this interface can serve, mirroring the execution
      // path: a plaintext primary unless the service terminates its own TLS, plus
      // an SSL binding when it's native-SSL or StartOS adds SSL.
      const host =
        packageId && hostId
          ? await sdk.host.get(effects, { hostId, packageId }).once()
          : null
      const binding =
        internalPort != null ? host?.bindings[internalPort] : undefined
      const nativeSsl = binding?.options.secure?.ssl === true
      const availNonSsl = !!binding?.enabled && !nativeSsl
      const availSsl =
        !!binding?.enabled && (nativeSsl || !!binding.options.addSsl)

      const variants: Record<
        string,
        {
          name: string
          spec: typeof privateKeySpec | ReturnType<typeof InputSpec.of>
        }
      > = {}

      for (const [key, entry] of Object.entries(entries)) {
        if (!entry || internalPort == null) continue

        const bindingPorts = Object.values(entry.ports).filter(
          (p) => p?.internalPort === internalPort,
        )
        const hasNonSsl = bindingPorts.some((p) => p && !p.ssl)
        const hasSsl = bindingPorts.some((p) => p?.ssl)

        // Skip an address that doesn't serve this binding at all, or one already
        // attached to every binding the interface offers (non-SSL, plus SSL when
        // available).
        if (!hasNonSsl && !hasSsl) continue
        if ((!availNonSsl || hasNonSsl) && (!availSsl || hasSsl)) continue

        let hostname = key
        try {
          const content = await sdk.volumes.tor.readFile(
            `${hsDir(packageId!, hostId!, key)}/hostname`,
          )
          hostname = content.toString().trim()
        } catch {
          // hostname file doesn't exist yet
        }
        variants[key] = {
          name: hostname,
          spec: InputSpec.of({}),
        }
      }

      variants['new'] = {
        name: i18n('Create new address'),
        spec: privateKeySpec,
      }

      return {
        name: i18n('Address'),
        default: 'new',
        disabled: false,
        variants: Variants.of(variants),
      }
    }),
  }))

export const addOnionService = sdk.Action.withInput(
  // id
  'add-onion-service',

  // metadata
  async () => ({
    name: i18n('Add Onion Service'),
    description: i18n('Add a Tor onion service for this URL'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
  }),

  // input spec
  async ({ effects, prefill }) => {
    const p = prefill as typeof inputSpec._PARTIAL
    let noSsl = false

    const meta = p?.urlPluginMetadata
    if (meta?.packageId && meta.hostId && meta.internalPort != null) {
      const internalPort = meta.internalPort
      noSsl = await sdk.host
        .get(
          effects,
          { hostId: meta.hostId, packageId: meta.packageId },
          (host) => !host?.bindings[internalPort]?.options.addSsl,
        )
        .once()
    }

    return inputSpec.filter(
      {
        ssl: !noSsl,
      },
      true,
    )
  },

  // pre-fill (none needed - system provides urlPluginMetadata)
  async () => null,

  // execution
  async ({ effects, input }) => {
    const { packageId, hostId, internalPort } = input.urlPluginMetadata
    const address = input.address as {
      selection: string
      value: { privateKey?: string | null }
    }

    const host = await sdk.host.get(effects, { hostId, packageId }).once()
    const binding = host?.bindings[internalPort]

    // A binding that terminates its own TLS (native `secure.ssl`) is SSL-only:
    // it has no plaintext endpoint, so the only honest onion is an SSL one. Such
    // a binding shows no SSL toggle (the toggle is offered only for `addSsl`
    // bindings, which expose both a plaintext and a StartOS-terminated SSL
    // port), so `input.ssl` is absent — infer SSL from the binding itself.
    const nativeSsl = binding?.options.secure?.ssl === true
    const ssl = !!input.ssl || nativeSsl

    // Build the port entry. The target is always the interface's LXC-bridge
    // `host:port` (the deprecated `<pkg>.startos` container hostname is gone);
    // the bridge exposes an http and an https variant, and we pick by `ssl`.
    const newPorts: Record<
      string,
      { target: string; ssl: boolean; internalPort: number }
    > = {}

    if (ssl && nativeSsl && binding?.enabled) {
      // The service speaks TLS on its own port, so Tor forwards raw TCP to the
      // bridge's https address for it.
      const addr = bridgeHost(host, internalPort, true)
      if (addr) {
        newPorts[String(binding.options.preferredExternalPort)] = {
          target: `${addr.hostname}:${addr.port}`,
          ssl: true,
          internalPort,
        }
      }
    } else if (ssl && binding?.options.addSsl) {
      // StartOS terminates TLS on the bridge's https port and forwards
      // plaintext to the container; the onion targets that port.
      const addr = bridgeHost(host, internalPort, true)
      if (addr) {
        newPorts[String(binding.options.addSsl.preferredExternalPort)] = {
          target: `${addr.hostname}:${addr.port}`,
          ssl: true,
          internalPort,
        }
      }
    } else {
      if (binding?.enabled) {
        const addr = bridgeHost(host, internalPort, false)
        if (addr) {
          newPorts[String(binding.options.preferredExternalPort)] = {
            target: `${addr.hostname}:${addr.port}`,
            ssl: false,
            internalPort,
          }
        }
      } else {
        throw new Error(
          `Cannot create an onion service for "${packageId}": interface binding ${internalPort} is not exposed, so there is no reachable endpoint to forward to.`,
        )
      }
    }

    const config = await torrc.read().once()
    const onionServices = config?.onionServices || {}
    if (!onionServices[packageId]) onionServices[packageId] = {}
    if (!onionServices[packageId][hostId]) onionServices[packageId][hostId] = {}

    const services = onionServices[packageId][hostId]

    if (address.selection !== 'new') {
      // Reuse existing address by key
      const existing = services[address.selection]
      if (existing) {
        const duplicate = Object.values(existing.ports).some(
          (p) => p?.ssl === ssl && p?.internalPort === internalPort,
        )
        if (duplicate) {
          throw new Error(
            ssl
              ? i18n(
                  'This onion address already has an SSL binding for this port',
                )
              : i18n(
                  'This onion address already has a non-SSL binding for this port',
                ),
          )
        }
        services[address.selection] = {
          ports: { ...existing.ports, ...newPorts },
        }
      }
    } else {
      // Create new entry
      const key = nextKey(services)
      services[key] = { ports: newPorts }

      const dir = hsDir(packageId, hostId, key)
      const { secretKey, hostname } = generateOnionFiles(
        address.value.privateKey,
      )
      await sdk.volumes.tor.writeFile(`${dir}/hs_ed25519_secret_key`, secretKey)
      await sdk.volumes.tor.writeFile(`${dir}/hostname`, hostname + '\n')
    }

    await torrc.merge(effects, { onionServices })
  },
)
