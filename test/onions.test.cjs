const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { test, beforeEach, afterEach } = require('node:test')
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

const { sdk } = require('../startos/sdk.ts')
const watch = (read) => ({
  once: async () => read(),
  const: async () => read(),
})
let hosts, addresses, contents, torrc, exported, lookupFails
const root = require('node:fs').mkdtempSync(
  path.join(os.tmpdir(), 'tor-onions-'),
)
sdk.volumes.tor.path = path.join(root, 'tor')
sdk.volumes.startos.path = path.join(root, 'startos')
sdk.setupOnInit = (fn) => fn
sdk.plugin.url.setupExportedUrls = (fn) => fn
sdk.plugin.url.exportUrl = async (_effects, value) => exported.push(value)
sdk.host.get = (_effects, { packageId, hostId }, project = (host) => host) =>
  watch(() => {
    if (lookupFails) throw new Error('Host lookup failed')
    return project(hosts[`${packageId}/${hostId}`] ?? null)
  })
sdk.host.getBridgeAddress = (
  _effects,
  { packageId, hostId, internalPort, ssl },
) =>
  watch(
    () => addresses[`${packageId}/${hostId}/${internalPort}/${ssl}`] ?? null,
  )

const store = require('../startos/fileModels/store.json.ts')
store.storeJson.read = (project = (value) => value) =>
  watch(() => project(structuredClone(contents)))
store.storeJson.write = async (_effects, value) => {
  contents = structuredClone(value)
}
const { torrcFile } = require('../startos/fileModels/torrc.ts')
torrcFile.read = () => watch(() => torrc)
torrcFile.write = async (_effects, value) => {
  torrc = value
}
const { renderTorrc } = require('../startos/init/renderTorrc.ts')
const { exportUrls } = require('../startos/plugin/url.ts')
const { addOnionService } = require('../startos/actions/addOnionService.ts')
const {
  deleteOnionService,
} = require('../startos/actions/deleteOnionService.ts')
const {
  deleteUnusedAddresses,
} = require('../startos/actions/deleteUnusedAddresses.ts')
const {
  migrateOnionAddresses,
} = require('../startos/init/migrateOnionAddresses.ts')
const { generateOnionFiles, isClamped } = require('../startos/utils/index.ts')
const { isServed, onionHostname } = require('../startos/utils/onions.ts')
const effects = { eventId: 'onion-test', isInContext: true }
const port = { externalPort: 8333, internalPort: 58333, ssl: false }
const binding = (enabled = true) => ({
  enabled,
  options: {
    preferredExternalPort: 8333,
    secure: { ssl: false },
    addSsl: null,
  },
  interfaces: { peer: { type: 'p2p' } },
})
const metadata = (hostId = 'peer', packageId = 'bitcoind') => ({
  packageId,
  hostId,
  interfaceId: 'peer',
  internalPort: 58333,
})
const input = (selection, hostId = 'peer', packageId = 'bitcoind') => ({
  urlPluginMetadata: metadata(hostId, packageId),
  ssl: false,
  address: {
    selection,
    value: selection === 'new' ? { privateKey: null } : {},
  },
})
async function seed(id, ports = [port]) {
  contents.onions[id] = { ports }
  const files = generateOnionFiles()
  await sdk.volumes.tor.writeFile(
    `${store.hsDir(id)}/hostname`,
    `${files.hostname}\n`,
  )
  await sdk.volumes.tor.writeFile(
    `${store.hsDir(id)}/hs_ed25519_secret_key`,
    files.secretKey,
  )
  return files
}
async function run(action, value, caller = null) {
  await action.getInput({ effects, prefill: value, caller })
  return action.run({ effects, input: value, caller })
}

beforeEach(async () => {
  await fs.mkdir(root, { recursive: true })
  hosts = { 'bitcoind/peer': { bindings: { 58333: binding() } } }
  addresses = { 'bitcoind/peer/58333/false': '10.0.3.1:50000' }
  contents = { automaticRecovery: true, onions: {} }
  torrc = ''
  exported = []
  lookupFails = false
})
afterEach(async () => fs.rm(root, { recursive: true, force: true }))

test('rendering and URL export require the same enabled bridge leg', async () => {
  const id = 'bitcoind/peer/0'
  await seed(id)
  for (const [enabled, target, served] of [
    [true, '10.0.3.1:50000', true],
    [true, null, false],
    [false, '10.0.3.1:50000', false],
  ]) {
    hosts['bitcoind/peer'].bindings[58333].enabled = enabled
    addresses['bitcoind/peer/58333/false'] = target
    exported = []
    await renderTorrc(effects)
    await exportUrls({ effects })
    assert.equal(torrc.includes('HiddenServicePort 8333'), served)
    assert.equal(exported.length, served ? 1 : 0)
  }
  assert.equal(await isServed(effects, id, contents.onions[id]), true)
  delete hosts['bitcoind/peer']
  await renderTorrc(effects)
  exported = []
  await exportUrls({ effects })
  assert.equal(exported.length, 0)
  assert.equal(await isServed(effects, id, contents.onions[id]), false)
  assert.ok(contents.onions[id])
  assert.ok(await onionHostname(id))
})

test('legacy peer-port reuse retains the hostname and public onion port', async () => {
  const id = 'bitcoind/peer/0'
  const files = await seed(id, [{ ...port, internalPort: 8333 }])
  await run(addOnionService, input(id), 'bitcoind')
  assert.deepEqual(contents.onions[id].ports, [port])
  assert.equal(await onionHostname(id), files.hostname)
})

test('an unused address can move within its package without moving its keys', async () => {
  const id = 'bitcoind/old-peer/0'
  const files = await seed(id)
  await run(addOnionService, input(id), 'bitcoind')
  const moved = 'bitcoind/peer/0'
  assert.equal(contents.onions[id], undefined)
  assert.equal(contents.onions[moved].keyId, id)
  assert.deepEqual(contents.onions[moved].ports, [port])
  assert.equal(
    await onionHostname(moved, contents.onions[moved]),
    files.hostname,
  )
  assert.deepEqual(
    await sdk.volumes.tor.readFile(
      `${store.hsDir(moved, contents.onions[moved])}/hs_ed25519_secret_key`,
    ),
    files.secretKey,
  )
  await renderTorrc(effects)
  assert.ok(torrc.includes(`/var/lib/tor/${store.hsDir(id)}/`))
  await exportUrls({ effects })
  assert.equal(exported[0].hostnameInfo.hostname, files.hostname)
  assert.equal(exported[0].hostnameInfo.hostId, 'peer')

  await run(
    deleteOnionService,
    {
      urlPluginMetadata: {
        ...metadata(),
        hostname: files.hostname,
        port: 8333,
        ssl: false,
      },
    },
    'bitcoind',
  )
  assert.equal(contents.onions[moved].ports.length, 0)
  await run(deleteUnusedAddresses, { addresses: [moved] })
  assert.equal(contents.onions[moved], undefined)
  assert.equal(await onionHostname(id), null)
})

test('cross-host reuse rejects an address that became disabled after opening the form', async () => {
  const id = 'bitcoind/old-peer/0'
  await seed(id)
  const value = input(id)
  await addOnionService.getInput({
    effects,
    prefill: value,
    caller: 'bitcoind',
  })
  hosts['bitcoind/old-peer'] = { bindings: { 58333: binding(false) } }
  await assert.rejects(
    addOnionService.run({ effects, input: value, caller: 'bitcoind' }),
    /unused onion/,
  )
  assert.ok(contents.onions[id])
})

test('callers cannot list or mutate another package’s addresses', async () => {
  await seed('other/old-peer/0')
  await assert.rejects(
    addOnionService.getInput({
      effects,
      prefill: input('new'),
      caller: 'other',
    }),
    /only manage its own/,
  )
  const form = await addOnionService.getInput({
    effects,
    prefill: input('new'),
    caller: null,
  })
  assert.equal(JSON.stringify(form.spec).includes('other/old-peer/0'), false)

  hosts['other/old-peer'] = { bindings: { 58333: binding() } }
  const value = input('other/old-peer/0', 'old-peer', 'other')
  await addOnionService.getInput({ effects, prefill: value, caller: null })
  value.urlPluginMetadata = metadata()
  await assert.rejects(
    addOnionService.run({ effects, input: value, caller: null }),
    /another service/,
  )
  assert.ok(contents.onions['other/old-peer/0'])
})

test('lookup failure prevents deleting a key selected as unused', async () => {
  const id = 'bitcoind/old-peer/0'
  const files = await seed(id)
  await deleteUnusedAddresses.getInput({ effects, caller: null })
  lookupFails = true
  await assert.rejects(
    deleteUnusedAddresses.run({
      effects,
      input: { addresses: [id] },
      caller: null,
    }),
    /Host lookup failed/,
  )
  assert.ok(contents.onions[id])
  assert.equal(await onionHostname(id), files.hostname)
})

test('an interrupted legacy import preserves absent-host keys and retries without duplication', async () => {
  const files = generateOnionFiles()
  const key = files.secretKey.subarray(32)
  assert.equal(isClamped(key.subarray(0, 32)), true)
  await sdk.volumes.startos.writeFile(
    'onion-migration.json',
    JSON.stringify({
      addresses: [
        {
          packageId: 'missing',
          hostId: 'old-host',
          hostname: files.hostname,
          key: key.toString('base64'),
        },
      ],
    }),
  )
  await fs.mkdir(sdk.volumes.startos.subpath('.onion-migration.json.bak'))
  await assert.rejects(migrateOnionAddresses(effects))
  const id = 'missing/old-host/0'
  assert.deepEqual(contents.onions[id].ports, [])
  assert.equal(await onionHostname(id), files.hostname)
  await fs.rmdir(sdk.volumes.startos.subpath('.onion-migration.json.bak'))
  await migrateOnionAddresses(effects)
  assert.deepEqual(Object.keys(contents.onions), [id])
  assert.equal(await onionHostname(id), files.hostname)
})
