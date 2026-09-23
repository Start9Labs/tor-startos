import {
  hsDir,
  nextIndex,
  onionId,
  parseOnionId,
  present,
  storeJson,
  writeOnions,
} from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { generateOnionFiles } from '../utils'
import { isServed, onionHostname, requireOwner } from '../utils/onions'

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

      const onions = present(await storeJson.read((s) => s.onions).once())

      // Which onion bindings this interface can serve, mirroring the execution
      // path: a plaintext primary unless the service terminates its own TLS, plus
      // an SSL binding when it's native-SSL or StartOS adds SSL.
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

      for (const [id, onion] of Object.entries(onions)) {
        const owner = parseOnionId(id)
        if (owner.packageId !== packageId || owner.hostId !== hostId) continue

        const served = onion.ports.filter(
          (p) => p.internalPort === internalPort,
        )
        const hasNonSsl = served.some((p) => !p.ssl)
        const hasSsl = served.some((p) => p.ssl)

        // An address of this host that nothing is using is the host's to attach
        // again. Otherwise skip one that doesn't serve this binding at all, or
        // is already attached to every binding the interface offers (non-SSL,
        // plus SSL when available).
        if (await isServed(effects, id, onion)) {
          if (!hasNonSsl && !hasSsl) continue
          if ((!availNonSsl || hasNonSsl) && (!availSsl || hasSsl)) continue
        }

        variants[id] = {
          name: (await onionHostname(id)) ?? id,
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
    access: 'public',
  }),

  // input spec
  async ({ effects, prefill, caller }) => {
    const p = prefill as typeof inputSpec._PARTIAL
    let noSsl = false

    const meta = p?.urlPluginMetadata
    requireOwner(caller, meta?.packageId)
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
  async ({ effects, input, caller }) => {
    const { packageId, hostId, internalPort } = input.urlPluginMetadata
    requireOwner(caller, packageId)
    const address = input.address as {
      selection: string
      value: { privateKey?: string | null }
    }

    const binding = await sdk.host
      .get(
        effects,
        { hostId, packageId },
        (host) => host?.bindings[internalPort] ?? null,
      )
      .once()
    if (!binding?.enabled) {
      throw new Error(
        `Cannot create an onion service for "${packageId}": interface binding ${internalPort} is not exposed, so there is no reachable endpoint to forward to.`,
      )
    }

    // A binding that terminates its own TLS has no plaintext endpoint and shows
    // no SSL toggle, so its onion is an SSL one whatever the input says. An
    // `addSsl` binding offers both, on two different external ports.
    const nativeSsl = binding.options.secure?.ssl === true
    const ssl = nativeSsl || (!!input.ssl && !!binding.options.addSsl)
    const port = {
      externalPort:
        !nativeSsl && ssl
          ? binding.options.addSsl!.preferredExternalPort
          : binding.options.preferredExternalPort,
      internalPort,
      ssl,
    }

    const onions = present(await storeJson.read((s) => s.onions).once())

    if (address.selection !== 'new') {
      const existing = onions[address.selection]
      if (!existing) return
      if (
        existing.ports.some(
          (p) => p.ssl === ssl && p.internalPort === internalPort,
        )
      ) {
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
      // Attaching is the moment to shed mappings whose binding is gone.
      const bound = await sdk.host
        .get(effects, { hostId, packageId }, (host) =>
          Object.keys(host?.bindings ?? {}).map(Number),
        )
        .once()
      onions[address.selection] = {
        ...existing,
        ports: [
          ...existing.ports.filter(
            (p) =>
              bound.includes(p.internalPort) &&
              p.externalPort !== port.externalPort,
          ),
          port,
        ],
      }
    } else {
      const id = onionId(
        packageId,
        hostId,
        await nextIndex(onions, packageId, hostId),
      )
      const { secretKey, hostname } = generateOnionFiles(
        address.value.privateKey,
      )
      const dir = hsDir(id)
      await sdk.volumes.tor.writeFile(`${dir}/hs_ed25519_secret_key`, secretKey)
      await sdk.volumes.tor.writeFile(`${dir}/hostname`, hostname + '\n')
      onions[id] = { ports: [port] }
    }

    await writeOnions(effects, onions)
  },
)
