# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **`socksHostId` and `socksPort` in `startos/utils/` are a published contract.** Sixteen packaging repos across both registries import them from `tor-startos/startos/utils`, and nothing in this repo references them — so renaming either, or moving them off that module path, breaks every dependent with no signal here. `utils/` resolves through its `index.ts`, which makes the directory name load-bearing too.
- **The wipe must happen in `main` before any daemon is constructed.** A running Tor holds its network state in memory and flushes it on shutdown, so deleting the files underneath it writes the same entry nodes straight back. That is why the wipe is queued to a file and applied at the next start.
- **`PRESERVE` is an allow-list on purpose.** A wipe that misses a cache file leaves the bad entry node in place — the exact failure being recovered from. Anything new the package persists on the `tor` volume must be added to it.
- **The watchdog wipes at most once per outage.** Past that the cause is not stale state, and retrying just restarts the service in a loop; the check reports the failure instead.
- **Any bootstrap-percentage movement resets the stall clock but not the attempt ladder.** Only a healthy reading resets the ladder — otherwise a Tor that crawls forward a percent at a time never escalates.
- **The `# @service` / `# @ssl` / `# @internalPort` comments in `torrc` are structural.** There is no round-trippable torrc format, so the parser reconstructs package id, host id, and upstream port from them. Stripping them loses that mapping.
- **Onion-service indexes are never reused after a deletion.** The index is a `HiddenServiceDir` path holding key material; reusing one would put a new service on a stale key directory.
- **Prune only on a confirmed-gone host.** `sdk.host.get` returning null means gone; a thrown lookup means unknown, and must keep the entry and its keys. Also map to a boolean before `.const()` — subscribing to the whole host re-fires on the export phase's own writes and spins the pass indefinitely.
- **Reconcile onion targets ahead of `reloadTorrc`.** Both are init handlers and `setupInit` runs them in order, so putting the repair first is what gets it to Tor in the pass that finds it. Watch the bridge address itself (`getBridgeAddress`), never the whole host, for the same spin reason as above.
