<p align="center">
  <img src="icon.svg" alt="Tor Logo" width="21%">
</p>

# Tor on StartOS

> Everything not listed in this document should behave the same as upstream
> Tor. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Tor](https://gitlab.torproject.org/tpo/core/tor/) is the anonymity network daemon. On StartOS it is infrastructure rather than an app: it gives every other service a SOCKS proxy for outbound traffic and `.onion` addresses for inbound, and hands those addresses to StartOS through a plugin.

- **Upstream repo:** <https://gitlab.torproject.org/tpo/core/tor/>
- **Wrapper repo:** <https://github.com/Start9Labs/tor-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

A minimal Alpine build around the distribution's `tor` package — no upstream image exists to use.

| Property      | Value                                   |
| ------------- | --------------------------------------- |
| Image         | Built from `Dockerfile` (`FROM alpine`) |
| Architectures | x86_64, aarch64, **riscv64**            |
| Command       | `tor -f /var/lib/tor/torrc`             |

| Subcontainer | Purpose                                                             |
| ------------ | ------------------------------------------------------------------- |
| `tor-sub`    | The `tor` daemon — `start-cli package attach tor` lands in it       |
| `chown-tmp`  | Temporary; re-owns hidden-service directories after a config change |

One oneshot, `chown`, runs first: Tor runs as the `tor` user and refuses a data directory that is not mode 700 and owned by it, while StartOS creates volumes root-owned.

riscv64 is deliberate: Tor is infrastructure other packages depend on, so it should be available wherever StartOS runs.

## Volume and Data Layout

| Volume    | Mount Point    | Purpose                                                     |
| --------- | -------------- | ----------------------------------------------------------- |
| `tor`     | `/var/lib/tor` | `torrc`, the onion keys, Tor's own data, the control socket |
| `startos` | — (host side)  | `store.json`; a one-time onion import file. Never mounted   |

Inside the `tor` volume:

| Path                             | What it is                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `torrc`                          | Tor's config. The top is the user's; the rest is generated — see [File Models](#file-models)      |
| `hidden_services/`               | One directory per `.onion` address, `<package>/<host>/hs_<index>/`. **Irreplaceable**             |
| `data/`                          | Tor's `DataDirectory`: the `state` file that pins its entry nodes, and its caches. **Disposable** |
| `control.sock`                   | Tor's control socket, which the health check and the reload use                                   |
| `.wipe-requested`, `.auto-wiped` | The watchdog's flags. Present means set                                                           |
| `keys/`                          | A relay's identity, on a server that ran one under an earlier release. Unused, and left in place  |
| `torrc.legacy`                   | The `torrc` an earlier release wrote, set aside by the update to `0.4.9.12:7`. A record only      |

**Each `hidden_services/` key _is_ its `.onion` address** — lose it and the address is gone for good. Everything Tor can rebuild lives under `data/`, which is what makes a reset a matter of deleting that one directory.

## File Models

| File         | Volume    | Format | Modelled                      | Written by                        |
| ------------ | --------- | ------ | ----------------------------- | --------------------------------- |
| `store.json` | `startos` | JSON   | Yes — `FileHelper.json`       | The actions, the URL plugin, init |
| `torrc`      | `tor`     | Text   | No — written, never read back | `init/renderTorrc`                |

**`store.json` is the source of truth.** It holds `automaticRecovery`, and `onions`: a record keyed `<package>/<host>/<index>`, each entry carrying its `ports` (`externalPort`, `internalPort`, `ssl`). It does not hold a forward target, and nothing in it is ever removed automatically.

**`torrc` is rendered from it, one way.** A line beginning `# ===== Everything below this line is generated` splits the file:

- **Above the marker is the user's.** It is carried over byte for byte on every render, and Tor honors it. A file with no marker is treated as all user section.
- **Below the marker is generated** and replaced on every render: `SocksPort`, `DataDirectory`, `ControlSocket`, then a `HiddenServiceDir` block per address. To change it, change the store — through a service's interface page or Tor's actions.
- Tor takes the **last** value of a single-valued option, so the generated `DataDirectory` wins over one written above the marker. List options such as `SocksPort` are additive, so a user can add a listener but not displace the package's.

**An onion's forward target is resolved when the file is rendered**, from the live binding, and the render re-runs whenever a target changes. A port with no bridge address is left out, and an address with no port left to forward to is not written at all. Nothing stale is ever kept to point at a port another service might later hold.

## Dependencies

None, and by design. Tor sits underneath other services rather than beside them. Dependents import `socksHostId` and `socksPort` from `tor-startos/startos/utils` to reach the proxy.

## Network Access and Interfaces

The SOCKS proxy is a binding with **no exported interface**: an unexported binding lands only on loopback and the LXC bridge, never the LAN. `SocksPort 0.0.0.0:9050` binds every interface of the _container_, which has only those two, so Tor's start-up warning about a public address is expected.

| Binding      | Host    | Port | Exported?                     |
| ------------ | ------- | ---- | ----------------------------- |
| SOCKS5 proxy | `socks` | 9050 | No — bridge and loopback only |

The package exports no interface of its own.

### The URL plugin

Tor registers as StartOS's `url-v0` plugin provider. On every init, and whenever the store or a watched host changes, it exports each address to the interface it serves.

**A key is never deleted automatically, and neither is a mapping.** What gets cleaned up is what Tor listens on: `torrc` and the exported URLs only ever hold addresses that resolve right now.

| What happened                    | What Tor does                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| The service's ports moved        | Follows them — the target is resolved at render time                                                                                 |
| The binding was **disabled**     | Nothing. Disabled is not deleted: its ports stay reserved and nothing forwards to them, so the address is refused, never misdirected |
| The port or host was **retired** | Stops serving and exporting it. The address becomes unused                                                                           |
| The package was **uninstalled**  | Stops serving and exporting it. The address becomes unused, and comes back by itself if the package is installed again               |
| A restore has not reached it yet | Nothing to do — the address is served as soon as its host is bound, in whatever order packages are restored                          |
| A lookup threw                   | Skips it for this pass                                                                                                               |

**An unused address** is one none of whose ports has anywhere to forward to. It is not written to `torrc` and shows on no interface page. It leaves two ways: Add Onion Service offers it for any interface of the same host, which is how an address survives a service renumbering a port; and Delete Unused Onion Addresses destroys its key.

## Installation and First-Run Flow

Nothing to configure. Install seeds `store.json`, renders a `torrc`, starts Tor, and the SOCKS proxy is available once the bootstrap completes. There is no task, no account, and no credential.

**You do not add onion services by hand.** They arrive through the URL plugin when a service is given a Tor address on its interface page.

**An install carrying onion addresses from StartOS 0.3.5 imports them once.** If `onion-migration.json` is present on the `startos` volume, init derives each address from its key, writes the key material into place, and renames the file. Keys that are not properly clamped are skipped.

**Updating from `0.4.9.12:6` or earlier** runs a migration that reads the onions out of the old `torrc` into `store.json`, sets that file aside as `torrc.legacy`, and moves Tor's state and caches under `data/` so the update does not re-select the server's entry nodes. Relay settings are dropped. The downgrade is prohibited.

## Actions

### Add Onion Service / Delete Onion Service (hidden)

The plugin's table actions — StartOS invokes them from an interface page.

- **Add** attaches an address to the interface's binding: a new one, optionally from a supplied key, or an existing address of the same host that is unused or does not already cover the binding. Attaching to an existing address sheds any mapping of its whose binding is gone.
- **Delete** detaches: it removes that port's mapping and nothing else. The key stays, and an address left with no port becomes unused.

### Delete Unused Onion Addresses

The only thing in this package that destroys a key. It lists every unused address with its package and host, all selected by default, and deletes the selected ones with their keys.

- **What counts as unused:** no port of the address resolves to a bridge address.
- **What it changes:** deletes the `hidden_services/` directory and the store entry of each selected address. It checks again at run time: if any selected address has come into use since the form opened, it deletes nothing and fails naming them.
- **Repeat safety:** deleting is permanent — the key is the address.
- **Availability: any status.**

### Reset Tor Connection

Queues a wipe of `data/` and restarts. The deletion happens at the next start, before any daemon exists, because a running Tor holds that state in memory and writes it back on shutdown.

- **When to run it:** Tor is stuck bootstrapping, or keeps dropping circuits.
- **Cost:** Tor is offline for a few minutes, and it selects new entry nodes — see [the trade-off](#the-trade-off-behind-automatic-recovery).
- **Not affected:** the onion keys, `torrc`, and `store.json`, none of which are under `data/`.
- **Availability: only while the service is running.**

### Turn Off / Turn On Automatic Recovery

One action whose name, description and confirmation follow the current setting. It flips `automaticRecovery` in `store.json`. Off is **fail closed**: the watchdog never acts, and a stuck Tor stays offline until the user runs Reset Tor Connection.

## Tasks

None.

## Health Checks

| Check | Displayed         | Method                                                                  |
| ----- | ----------------- | ----------------------------------------------------------------------- |
| `tor` | "Tor SOCKS Proxy" | Tor's own control socket — bootstrap phase, circuit state, and dormancy |

The check reads Tor's real state: a bootstrap percentage with Tor's summary line while starting, and a distinct failure for "bootstrapped but cannot build circuits". **Dormant counts as healthy.** It polls once a second while unhealthy instead of the default thirty.

### The watchdog

With Automatic Recovery on, sustained unhealthiness escalates:

1. **Five minutes** with no movement in the bootstrap percentage: drop the pinned entry nodes and open circuits over the control socket (`DROPGUARDS`, `DROPTIMEOUTS`, `NEWNYM`).
2. **Once more**, ten minutes later.
3. **Twenty minutes after that**, queue a wipe of `data/` and restart.
4. **It wipes at most once per outage.** If Tor is still broken afterwards the cause is not stale state — most likely the server has no working internet — and the check says so and stops.

A healthy reading resets the ladder. With Automatic Recovery off, none of this runs.

### The trade-off behind Automatic Recovery

Tor pins a small set of entry nodes and keeps them for months. That is deliberate: every fresh selection is another chance of picking an entry node run by an adversary, and the entry node is the one relay that sees this server's IP address. Tor's control specification says of `DROPGUARDS`, "Do not invoke this command lightly; it can increase vulnerability to tracking attacks over time."

The watchdog cannot tell a bad entry node from a dead link, so anyone able to interrupt this server's connection for five minutes forces a fresh selection, and can repeat that. For most servers staying reachable matters more, which is why the setting defaults to on. The user-facing text states the trade-off and nothing of this mechanism, on purpose.

## Backups and Restore

Both volumes are backed up — `sdk.Backups.ofVolumes('tor', 'startos')`. The store maps each key directory to the interface it serves, so the two travel together.

- **This backup contains the private keys behind every `.onion` address on the server.** Anyone holding it can impersonate those addresses.
- **Restore order does not matter.** Nothing is pruned, so Tor can be restored before, with, or after the services that own its addresses, and each address is served as soon as its host is bound. One whose service never comes back stays unused until Delete Unused Onion Addresses removes it.
- A backup taken by `0.4.9.12:6` or earlier holds only the `tor` volume; restoring it runs the same migration an update does.

## Limitations and Differences

1. **Everything below the marker in `torrc` is generated**, and hand edits there do not survive. Edits above it do.
2. **Onion services are not added by hand.** They come from other services through the URL plugin.
3. **Deleting an address is irreversible** — the key is the address.
4. **A key is only ever deleted by hand.** Uninstalling a service, or retiring its host or port, leaves its addresses unused rather than deleting them, and installing the service again brings them back.
5. **The SOCKS proxy is not exported** and is reachable only over loopback and the LXC bridge.
6. **The `tor` health check can restart the service on its own** while Automatic Recovery is on.
7. **No relay or bridge mode.** It was removed in `0.4.9.12:7`: a relay's IP address is publicly listed, and a server that is both a listed relay and the host of `.onion` addresses can have the two linked by load and timing measurements, whether or not they share a process. A relay's identity under `keys/` is left in place. On StartOS releases with no way to delete a binding, the old `or-multi` binding remains as a disabled record.

---

## Quick Reference for AI Consumers

```yaml
package_id: tor
image: ./Dockerfile # FROM alpine, apk add tor
architectures:
  - x86_64
  - aarch64
  - riscv64
subcontainers:
  - tor-sub # the running daemon
  - chown-tmp # temporary; re-owns hidden-service dirs after a config change
volumes:
  tor: /var/lib/tor
  startos: host side, never mounted (store.json; one-time onion import)
file_models:
  - store.json # startos volume; source of truth: onions + automaticRecovery
generated_files:
  - /var/lib/tor/torrc # user section above the marker is kept; the rest is rendered from store.json
disposable:
  - /var/lib/tor/data # Tor's DataDirectory; Reset Tor Connection deletes it
irreplaceable:
  - /var/lib/tor/hidden_services # one key directory per .onion address
flag_files: # present = set
  - /var/lib/tor/.wipe-requested
  - /var/lib/tor/.auto-wiped
startos_managed_env_vars: []
dependencies: []
interfaces: []
actions:
  - add-onion-service # hidden; driven by the url-v0 plugin
  - delete-onion-service # hidden; driven by the url-v0 plugin
  - delete-unused-addresses # the only action that destroys a key
  - reset-connection # only-running
  - automatic-recovery # toggles store.json automaticRecovery; off = fail closed
tasks: []
health_checks:
  - tor # displayed "Tor SOCKS Proxy"; also the self-recovery watchdog
```

> **For dependent packages:** the SOCKS proxy is an unexported binding on host
> `socks`, port 9050. Import `socksHostId` and `socksPort` from
> `tor-startos/startos/utils` rather than hardcoding either.
