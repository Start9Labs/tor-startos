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

- **`socksHostId` and `socksPort` in `startos/utils/` are a published contract.** Other packaging repos import them from `tor-startos/startos/utils`, and nothing in this repo references them — so renaming either, or moving them off that module path, breaks every dependent with no signal here. `utils/` resolves through its `index.ts`, which makes the directory name load-bearing too.
- **Anything the package persists on the `tor` volume goes outside `data/`.** That directory is Tor's `DataDirectory` and Reset Tor Connection deletes it whole; there is no allow-list to add a new file to.
- **`startos/versions/legacy/torrc.ts` is frozen.** It is the two-way `torrc` model earlier releases used, relay parsing included, and the `0.4.9.11:6` and `0.4.9.12:7` migrations read old volumes through it. Nothing else may import it, and tidying it changes what those migrations see.
