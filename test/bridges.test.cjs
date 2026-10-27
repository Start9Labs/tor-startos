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

const store = require('../startos/fileModels/store.json.ts')
let contents
const watch = (read) => ({
  once: async () => read(),
  const: async () => read(),
})
store.storeJson.read = (project = (value) => value) =>
  watch(() => project(structuredClone(contents)))
store.storeJson.merge = async (_effects, value) => {
  contents = { ...contents, ...structuredClone(value) }
}
const { render } = require('../startos/torrc/render.ts')
const { connectViaBridges } = require('../startos/actions/connectViaBridges.ts')
const { stopUsingBridges } = require('../startos/actions/stopUsingBridges.ts')
const control = require('../startos/utils/control.ts')
const { watchdog } = require('../startos/utils/recovery.ts')
const effects = { eventId: 'bridge-test' }

// Tor Browser's defaults, from tor-browser-build's pt_config.json.
const obfs4 =
  'obfs4 37.218.245.14:38224 D9A82D2F9C2F65A18407B1D2B764F130847F8B5D cert=bjRaMrr1BRiAW8IE9U5z27fQaYgOhX1UCmOpg2pFpoMvo6ZgQMzLsaTzzQNTlm7hNcb+Sg iat-mode=0'
const snowflake =
  'snowflake 192.0.2.3:80 2B280B23E1107BB62ABFC40DDCC8824814F80A72 fingerprint=2B280B23E1107BB62ABFC40DDCC8824814F80A72 url=https://1098762253.rsc.cdn77.org/ fronts=app.datapacket.com,www.datapacket.com ice=stun:stun.epygi.com:3478,stun:stun.uls.co.za:3478,stun:stun.voipgate.com:3478,stun:stun.mixvoip.com:3478,stun:stun.telnyx.com:3478,stun:stun.hot-chilli.net:3478,stun:stun.fitauto.ru:3478,stun:stun.m-online.net:3478 utls-imitate=hellorandomizedalpn'
const webtunnel =
  'webtunnel [2001:db8:5b2f:2b3:6d5f:ea8d:3dd5:2f30]:443 2B280B23E1107BB62ABFC40DDCC8824814F80A72 url=https://example.com/abcdef ver=0.0.1'

async function connect(bridges) {
  await connectViaBridges.getInput({ effects, prefill: null, caller: null })
  return connectViaBridges.run({ effects, input: { bridges }, caller: null })
}

beforeEach(() => {
  contents = { automaticRecovery: true, onions: {}, bridges: [] }
})

test('a paste is stored one bridge per line, whatever its whitespace', async () => {
  await connect(
    `\n  ${obfs4.replaceAll(' ', '\u00a0')}\r\n\n${snowflake}\t\n${webtunnel}\n${obfs4}\n`,
  )
  assert.deepEqual(contents.bridges, [obfs4, snowflake, webtunnel])
  const form = await connectViaBridges.getInput({
    effects,
    prefill: null,
    caller: null,
  })
  assert.equal(form.value.bridges, [obfs4, snowflake, webtunnel].join('\n'))

  await stopUsingBridges.run({ effects, input: {}, caller: null })
  assert.deepEqual(contents.bridges, [])
})

test('a paste Tor would refuse to start with fails and keeps the bridges', async () => {
  contents.bridges = [snowflake]
  for (const [paste, error] of [
    [
      'meek_lite 192.0.2.20:80 url=https://1603026938.rsc.cdn77.org front=www.phpmyadmin.net utls=HelloRandomizedALPN',
      /whole bridge line/,
    ],
    ['37.218.245.14:38224 D9A82D2F9C2F65A18407B1D2B764F130847F8B5D', /whole/],
    [`${obfs4} ${obfs4}`, /whole bridge line/],
    [obfs4.replace(' cert=', '\ncert='), /whole bridge line/],
    [obfs4.replace(' D9A82D2F9C2F65A18407B1D2B764F130847F8B5D', ''), /whole/],
    [`Here are your bridges:\n${obfs4}`, /whole bridge line/],
    [obfs4.replace('iat-mode=0', 'iat-mode=0\u200b'), /whole bridge line/],
    [`${obfs4} pad=${'é'.repeat(300)}`, /whole bridge line/],
    [obfs4.replace('37.218.245.14', '37.218.245.256'), /cannot use/],
    [obfs4.replace('37.218.245.14', '[37.218.245.14]'), /cannot use/],
    [obfs4.replace(':38224', ':65536'), /cannot use/],
    [`${obfs4} pad=${'x'.repeat(500)}`, /cannot use/],
    ['', /at least one/],
  ]) {
    await assert.rejects(connect(paste), error)
  }
  assert.deepEqual(contents.bridges, [snowflake])
})

test('the torrc carries only the transport plugins its bridges need', () => {
  const torrc = (bridges) =>
    render('', {
      root: '/var/lib/tor',
      source: 'test',
      socksPort: 9050,
      bridges,
      onions: [],
    })
  const plugins = (bridges) =>
    torrc(bridges)
      .split('\n')
      .filter((l) => /^(UseBridges|ClientTransportPlugin) /.test(l))
  assert.deepEqual(plugins([]), [])
  assert.deepEqual(plugins([obfs4]), [
    'UseBridges 1',
    'ClientTransportPlugin obfs4 exec /usr/bin/lyrebird',
  ])
  assert.deepEqual(plugins([snowflake, webtunnel, obfs4]), [
    'UseBridges 1',
    'ClientTransportPlugin obfs4,webtunnel exec /usr/bin/lyrebird',
    'ClientTransportPlugin snowflake exec /usr/bin/snowflake-client',
  ])
  assert.ok(torrc([obfs4]).includes(`\nBridge ${obfs4}\n`))
})

test('through bridges, the watchdog waits three times as long for bootstrap progress', async (t) => {
  let resets = 0
  control.probe = async () => ({
    bootstrap: { progress: 25, summary: 'Asking for networkstatus consensus' },
    circuitEstablished: true,
    dormant: false,
  })
  control.resetCircuits = async () => {
    resets += 1
    return true
  }
  let now = 0
  t.mock.method(Date, 'now', () => now)
  for (const [bridged, quiet, acts] of [
    [false, 4, 6],
    [true, 14, 16],
  ]) {
    resets = 0
    now = 0
    const check = watchdog(effects, false, bridged)
    await check()
    now = quiet * 60_000
    await check()
    assert.equal(resets, 0)
    now = acts * 60_000
    await check()
    assert.equal(resets, 1)
  }
})
