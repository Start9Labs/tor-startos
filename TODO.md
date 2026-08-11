# TODO

Both items below came out of the code review of the connection-recovery work
(#19) and share one root cause: `FileHelper` writes are neither crash-atomic nor
serialized, and `.watchdog.json` is the first file this package writes from more
than one place. Neither has been observed in the wild — they are reasoned from
the SDK source (`@start9labs/start-sdk@2.0.9`, `lib/util/fileHelper.js`), not
reproduced.

## A truncated `.watchdog.json` stops the service from starting

`FileHelper.writeFileRaw` is a bare `fs.writeFile` — no temp file, no rename — so
a crash or power cut mid-write can leave a partial file. `readOnce` then runs
`JSON.parse` on it with no guard, and `applyPendingWipe` (`utils/recovery.ts:65`)
is the first thing `main` awaits, before any daemon exists. The `SyntaxError`
propagates out of `main` and the service cannot start, on that boot and every one
after, because nothing gets far enough to rewrite the file. Only deleting it by
hand over SSH recovers.

The `.catch(false)` defaults on the zod fields do not help here: they are field
defaults applied to a parsed object, and the parse is what throws.

The window is small but sits exactly where it matters — the watchdog writes the
file and immediately calls `sdk.restart()` (`utils/recovery.ts:156-160`), which is
also the moment a user watching a wedged Tor is most likely to pull the plug.

Two candidate fixes, and the upstream one is the better buy:

- **In the SDK** — make `writeFileRaw` write to a temp path and `rename` over the
  target. `rename` is atomic on the same filesystem, so every package that uses a
  `FileHelper` gets crash-safety, not just this one. Worth raising against
  `start-technologies` rather than patching around it here.
- **In this package** — treat an unreadable `.watchdog.json` as absent. The file
  is disposable state: losing it costs at most one redundant wipe. A `try/catch`
  around the read in `applyPendingWipe` that falls back to
  `{ wipeRequested: false, autoWiped: false }` is enough, and is the right local
  fix regardless of whether the SDK change lands.

## Concurrent merges can silently drop a queued wipe

`FileHelper.merge` is an unlocked read-modify-write of the whole file: it reads,
merges the partial over what it read, and writes everything back. Three call
sites write `.watchdog.json`, and two of them run in **different processes** —
`requestWipe` from the action (`utils/recovery.ts:78`) and the healthy-path
`merge({ autoWiped: false })` from the health check (`utils/recovery.ts:117`) —
so an in-process mutex would not be enough.

The interleaving that loses data:

1. An auto-recovery has just succeeded, so the persisted state is
   `{ wipeRequested: false, autoWiped: true }`.
2. The first healthy reading lands and begins `merge({ autoWiped: false })`; it
   reads that state.
3. In the same instant the user runs **Reset Tor Connection**. `requestWipe`
   reads the same state and writes `{ wipeRequested: true, autoWiped: true }`.
4. The health check's merge completes, writing its stale view back:
   `{ wipeRequested: false, autoWiped: false }`.
5. `sdk.restart()` runs with nothing queued. Tor restarts onto the same entry
   nodes and the action appears to have done nothing.

Genuinely narrow — the healthy-path merge only fires on the one transition where
`autoWiped` was true, and the user has to press the button inside that window —
and the user recovers by pressing it again. Fixing it is still cheap: split the
two flags into separate files so the writers never touch the same one.
`autoWiped` is then written only by the watchdog, and `wipeRequested` only by the
action, the watchdog's escalation, and `main`'s clear — and the action can't
collide with `main` because it is `allowedStatuses: 'only-running'`.
