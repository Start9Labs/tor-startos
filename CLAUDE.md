# CLAUDE.md

See [CONTRIBUTING.md](CONTRIBUTING.md) for the doc map and contribution workflow.

## Operating rules

- Tor is installed via `apk add tor` from the Alpine base image — it is *not* pinned to an upstream Tor release. To pick up a newer Tor, bump the Alpine base image in `Dockerfile`; don't try to pin a Tor version directly.
- `torrc` on the `tor` volume is the single source of truth for runtime settings. It round-trips through the file model with `# @service` and `# @ssl` comment annotations — don't introduce a parallel config store.
- The `url-v0` plugin is how other packages get `.onion` URLs. Changes to plugin behavior ripple across every package that depends on it.
- Onion-service keys live under `/var/lib/tor/hidden_services/<packageId>/<hostId>/hs_<index>/`. The `chown` oneshot must run before the daemon — Tor refuses to start if `/var/lib/tor` isn't `700 tor:tor`.
