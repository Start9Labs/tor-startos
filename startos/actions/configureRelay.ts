import { utils } from '@start9labs/start-sdk'
import { torrc } from '../fileModels/torrc'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const relayInputSpec = InputSpec.of({
  enabled: Value.toggle({
    name: i18n('Enabled'),
    default: false,
  }),
  nickname: Value.text({
    name: i18n('Nickname'),
    description: null,
    required: false,
    default: 'StartOSRelay',
    placeholder: 'StartOSRelay',
    patterns: [
      {
        regex: '^[a-zA-Z0-9]{1,19}$',
        description: 'Must be 1-19 alphanumeric characters',
      },
    ],
    masked: false,
    inputmode: 'text',
    minLength: 1,
    maxLength: 19,
  }),
  contactInfo: Value.text({
    name: i18n('Contact Info'),
    description: null,
    required: false,
    default: null,
    placeholder: 'email@example.com',
    patterns: [utils.Patterns.email],
    masked: false,
    inputmode: 'email',
    minLength: null,
    maxLength: null,
  }),
  bridge: Value.toggle({
    name: i18n('Bridge Mode'),
    default: false,
  }),
  orPort: Value.number({
    name: i18n('OR Port'),
    description: i18n(
      'Changing the OR port while the relay is on restarts Tor, so that it tests the new port.',
    ),
    required: false,
    default: 9001,
    min: 1,
    max: 65535,
    integer: true,
    placeholder: null,
    units: null,
  }),
  bandwidthRate: Value.number({
    name: i18n('Bandwidth Rate'),
    description: i18n('Tor requires at least 75 KB/s for a relay.'),
    required: true,
    default: 1024,
    min: 75,
    max: null,
    integer: true,
    placeholder: null,
    units: 'KB/s',
  }),
  bandwidthBurst: Value.number({
    name: i18n('Bandwidth Burst'),
    description: i18n('Must be at least the Bandwidth Rate.'),
    required: true,
    default: 2048,
    min: 75,
    max: null,
    integer: true,
    placeholder: null,
    units: 'KB/s',
  }),
})

export const configureRelay = sdk.Action.withInput(
  // id
  'configure-relay',

  // metadata
  async () => ({
    name: i18n('Configure Relay'),
    description: i18n('Configure Tor relay and bridge settings'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // input spec
  relayInputSpec,

  // pre-fill from current config; InputSpec defaults fill any undefined fields
  async ({ effects }) => {
    return (await torrc.read((s) => s.relay).once()) ?? {}
  },

  // execution: merge relay input, converting nulls to undefined for zod .catch() defaults
  async ({ effects, input }) => {
    if (input.bandwidthBurst < input.bandwidthRate) {
      throw new Error(
        i18n('Bandwidth Burst must be at least the Bandwidth Rate.'),
      )
    }
    const before = await torrc.read((s) => s.relay).once()
    await torrc.merge(effects, {
      relay: {
        enabled: input.enabled,
        nickname: input.nickname ?? undefined,
        contactInfo: input.contactInfo ?? undefined,
        bridge: input.bridge,
        orPort: input.orPort ?? undefined,
        bandwidthRate: input.bandwidthRate,
        bandwidthBurst: input.bandwidthBurst,
      },
    })
    // Tor tests an ORPort only when it starts as a relay or its address
    // changes. A reload onto a new port keeps the old port's verdict, so the
    // relay would publish, and report as reachable, a port nobody has tested.
    if (
      before?.enabled &&
      input.enabled &&
      (input.orPort ?? 9001) !== before.orPort
    ) {
      await sdk.restart(effects)
    }
  },
)
