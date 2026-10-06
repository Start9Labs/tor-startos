const assert = require('node:assert/strict')
const { test, beforeEach } = require('node:test')
const ts = require('typescript')

require.extensions['.ts'] = (module, filename) => {
  const source = require('node:fs').readFileSync(filename, 'utf8')
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: filename,
    }).outputText,
    filename,
  )
}

const { setupOnionReattachment } = require('../startos/utils/reattach.ts')

const watch = (read) => ({
  once: async () => read(),
  const: async () => read(),
})
let pending, enabled, served, version, variants, formHasSsl, calls, fail
const sdk = {
  setupOnInit: (fn) => fn,
  host: {
    get: (_effects, opts, project) => {
      assert.deepEqual(opts, { hostId: 'peer', packageId: 'bitcoind' })
      return watch(() =>
        project({
          bindings: {
            58333: {
              enabled,
              addresses: {
                available: served.map((hostname) => ({
                  hostname,
                  metadata: { kind: 'plugin', packageId: 'tor' },
                })),
              },
            },
          },
        }),
      )
    },
  },
  getServiceManifest: (_effects, packageId, project) => {
    assert.equal(packageId, 'tor')
    return watch(() => project(version ? { version } : null))
  },
  action: {
    run: async (opts) => {
      assert.equal(opts.packageId, 'tor')
      assert.equal(opts.actionId, 'add-onion-service')
      const input = opts.input({ spec: formHasSsl ? { ssl: {} } : {} })
      assert.deepEqual(input.urlPluginMetadata, {
        packageId: 'bitcoind',
        hostId: 'peer',
        interfaceId: 'peer',
        internalPort: 58333,
      })
      if (fail) throw new Error('Tor action unavailable')
      calls.push(input)
    },
  },
}
const effects = {
  action: {
    getInput: async (opts) => {
      assert.equal(opts.packageId, 'tor')
      return { spec: { address: { type: 'union', variants } } }
    },
  },
}
const reattach = setupOnionReattachment(sdk, {
  packageId: 'bitcoind',
  hostId: 'peer',
  to: { interfaceId: 'peer', internalPort: 58333, ssl: false },
  pending: { const: async () => pending },
  clear: async () => {
    pending = false
  },
})

beforeEach(() => {
  pending = true
  enabled = true
  served = []
  version = '0.4.9.13:1'
  variants = { 'bitcoind/peer/0': { name: 'a.onion' }, new: { name: 'New' } }
  formHasSsl = false
  calls = []
  fail = false
})

test('a Tor without service-callable actions leaves the move pending', async () => {
  for (version of [null, '0.4.9.12:7', '0.4.9.13:0']) {
    await reattach(effects)
    assert.equal(pending, true)
    assert.deepEqual(calls, [])
  }
})

test('only unused addresses of the same host move', async () => {
  variants['bitcoind/rpc/0'] = { name: 'rpc.onion' }
  variants['bitcoind/peer/1'] = { name: 'served.onion' }
  variants['another/peer/0'] = { name: 'other.onion' }
  served = ['served.onion']
  await reattach(effects)
  assert.deepEqual(
    calls.map((c) => c.address.selection),
    ['bitcoind/peer/0'],
  )
  assert.equal(pending, false)
  await reattach(effects)
  assert.equal(calls.length, 1)
})

test('a disabled binding waits, and enabling it completes the move', async () => {
  enabled = false
  await reattach(effects)
  assert.equal(pending, true)
  enabled = true
  await reattach(effects)
  assert.equal(pending, false)
})

test('a failed run keeps the move pending for a retry', async () => {
  fail = true
  await reattach(effects)
  assert.equal(pending, true)
  fail = false
  await reattach(effects)
  assert.equal(pending, false)
  assert.equal(calls.length, 1)
})

test('ssl is answered only when the form asks for it', async () => {
  await reattach(effects)
  assert.equal('ssl' in calls[0], false)
  pending = true
  formHasSsl = true
  await reattach(effects)
  assert.equal(calls[1].ssl, false)
})
