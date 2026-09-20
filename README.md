<p align="center">
  <img src="icon.svg" alt="Tor Logo" width="21%">
</p>

# Tor on StartOS

> Everything not listed in this document should behave the same as upstream
> Tor. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Tor](https://gitlab.torproject.org/tpo/core/tor/) is the anonymity network daemon. On StartOS it is infrastructure rather than an app: it gives every other service a SOCKS proxy for outbound traffic and `.onion` addresses for inbound, hands those addresses to StartOS through a plugin, and recovers itself when it wedges on a bad entry node.

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

**The daemon is pointed at a torrc on the volume, not the image's `/etc/tor/torrc`**, because the package generates that file and Tor has to read the generated one.

One oneshot, `chown`, runs first: Tor runs as the `tor` user and refuses a data directory that is not mode 700 and owned by it, while StartOS creates volumes root-owned.

riscv64 is unusual in the fleet and deliberate here: Tor is infrastructure other packages depend on, so it should be available wherever StartOS runs.

## Volume and Data Layout

Two volumes, and only one of them enters the container.

| Volume    | Mount Point    | Purpose                                                                                                                  |
| --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `tor`     | `/var/lib/tor` | `torrc`, the hidden-service keys, the relay identity, Tor's network caches, the control socket, and the watchdog's state |
| `startos` | — (host side)  | A one-time onion-address import file; never mounted into a container                                                     |

**`hidden_services/` is the irreplaceable part.** Each subdirectory holds an ed25519 secret key, and that key _is_ the `.onion` address — lose it and the address is gone for good, with no way to regenerate it.

Everything else under `/var/lib/tor` divides into things the package generates (`torrc`), the relay's long-term identity under `keys/`, and Tor's cached view of the network. That last group is what the recovery path deletes.

## File Models

One model, and it is not a config format any parser handles.

| File    | Volume | Format     | Modelled                                             | Written by                    |
| ------- | ------ | ---------- | ---------------------------------------------------- | ----------------------------- |
| `torrc` | `tor`  | Tor config | Yes — `FileHelper` with custom serializer and parser | Every init, and three actions |

**`torrc` is generated wholesale from structured data, then parsed back out of the same file.** There is no round-trippable torrc format, so the serializer embeds `# @service`, `# @ssl`, and `# @internalPort` comment annotations, and the parser is a state machine that reconstructs the structure from them. Two consequences worth knowing:

- **A hand edit does not survive.** The next write regenerates the file from the parsed structure, and anything the parser does not understand is dropped.
- **Those comments are load-bearing.** Stripping them loses the package id, host id, and upstream port behind each onion service.
- **The relay's advertised address and port are derived, not configured.** An init handler re-asserts them from the OR binding on every init and whenever the binding's Public addresses or assigned port change: an `Address` line when exactly one gateway has the Public IPv4 address enabled, an `ORPort <assigned> NoListen` / `ORPort <configured> NoAdvertise` pair when StartOS assigned a different external port, and `IPv4Only` on the ORPort while no public IPv6 address is enabled. **Configure Relay** never sets them, and changing the OR port drops them until the handler derives them again.

The file always carries the SOCKS port, the data directory, and the control socket. `SocksPort 0.0.0.0:9050` binds every interface of the _container_, which has only loopback and the LXC bridge, so it is not a LAN exposure. Beyond that it holds the onion services — keyed by package, host, and an index that is **never reused after a deletion**, because the index is a directory path containing key material — and the relay settings when a relay is enabled.

The watchdog's state — whether a wipe is queued, and whether it has already wiped during the current outage — is two flag files beside the torrc, `.wipe-requested` and `.auto-wiped`. Present means set; there is nothing inside them to parse, and creating or removing one is atomic, so the health check and the Reset Tor Connection action can never tear or overwrite each other's write.

## Dependencies

None, and by design. Tor sits underneath other services rather than beside them — sixteen packages across both registries import its host id and port to reach the SOCKS proxy.

## Network Access and Interfaces

The SOCKS proxy is a binding with **no exported interface**, and that is deliberate: an unexported binding never reaches the LAN, so it lands only on loopback and the LXC bridge. Dependents get a stable bridge address and nothing to watch.

| Binding      | Host    | Port | Exported?                     |
| ------------ | ------- | ---- | ----------------------------- |
| SOCKS5 proxy | `socks` | 9050 | No — bridge and loopback only |

| Interface         | Id   | Type | Port                   | Present when       |
| ----------------- | ---- | ---- | ---------------------- | ------------------ |
| Tor Relay OR Port | `or` | p2p  | The configured OR port | A relay is enabled |

**The relay port is the exception to everything else here**: it is exported precisely so it can be reached from the public internet, which is what running a relay means. Its binding is `secure: { ssl: false }` — the OR protocol carries its own TLS, so StartOS treats it like any self-securing p2p port: LAN and `.local` addresses serve as soon as the interface exists, while each gateway's **Public** address is offered but stays off until the user enables it.

Public reachability needs the inbound path and the advertised address to agree. Enabling the Public address on a gateway opens the inbound path there: StartTunnel publishes the port automatically, and on a home connection StartOS asks the router for the forward (a router that refuses needs a manual one). The package keeps the advertised side in step with that — see [File Models](#file-models): with the Public IPv4 address enabled on exactly one gateway, `torrc` pins `Address` to it, and when another service already held the OR port's external slot, the relay advertises the port StartOS actually assigned. With Public enabled on more than one gateway nothing is pinned, and Tor advertises the address the directory authorities see on its **outbound** connections, which then has to be one of those gateways. A persistent `has not managed to confirm reachability for its ORPort(s)` warning, which the Relay Reachability health check surfaces in the UI, means the inbound path is missing or is on a gateway the relay does not advertise; it is not a bootstrap problem, and **Reset Tor Connection** will not fix it. The Public enable is stored against the exact address and port, so changing the OR port or the gateway's public IP turns it off until it is re-enabled.

**The package gives the relay no IPv6 address.** A bare `ORPort` is an IPv6 ORPort as well, and Tor cannot see the server's addresses from inside its container, so it would log `Unable to find IPv6 address for ORPort` once an hour; while no public IPv6 address is enabled on the interface the package writes `IPv4Only` and the notice never appears. With a public IPv6 address enabled the ORPort is left dual-stack and the address is left to Tor's own discovery, so unless Tor finds one the notice returns and the relay publishes over IPv4 alone — it is a notice, not a fault. The package deliberately pins no IPv6 address: Tor omits an IPv6 address it discovered itself when that address fails the self-test, but refuses to publish any descriptor while a _configured_ one fails it, which would take a working IPv4 relay off the network.

### The URL plugin

Tor registers itself as StartOS's `url-v0` plugin provider, which is how `.onion` addresses reach the rest of the system. On every init it exports the current set of onion URLs back to the packages they belong to, and in the same pass it prunes entries whose target package no longer exists — deleting the key material with them, since the address can never be reattached to anything. An entry whose host is missing while its package is still installed is kept and not exported: a batch restore writes every package's entry before any of them inits, and a host exists only once its package's own init binds it, which is what triggers the export. An entry the plugin cannot export — its host missing, or its binding gone from a host that still exists — stays a live `HiddenServiceDir` that no interface page shows; **Delete Onion Addresses** is the one place it can still be removed.

That pruning only fires on a package StartOS confirms is gone. A lookup that throws leaves the entry and its keys alone, because "I could not resolve this" is not "this no longer exists."

**An onion's forward target is re-derived on every start.** The `HiddenServicePort` target stored in `torrc` is the external port the binding held when the entry was written, and a binding's ports move — a package gaining `addSsl`, an OS upgrade reassigning them — after which Tor forwards to a port nothing owns and the address is refused at the SOCKS layer. An init handler resolves each entry's bridge address afresh and rewrites the ones that have drifted, which repairs the address without touching its key. It is a `.const()` watcher, so it also fires the moment a binding moves rather than waiting for the next start. An entry whose interface stopped serving the mode it was created with follows the mode it does serve instead — a plaintext onion on a binding that has become TLS-only is re-pointed at the TLS address and re-annotated — so the address keeps answering on the port it advertises. Only an entry with no bridge-reachable address at all is logged and left as it is.

## Installation and First-Run Flow

Nothing to configure and nothing to reveal. Install writes a torrc, starts Tor, and the SOCKS proxy is available to other services as soon as the bootstrap completes. There is no task, no account, and no credential.

The first start takes longer than later ones — Tor downloads a consensus and builds its first circuits, which is what the bootstrap percentage in the health check is reporting.

**You do not add onion services by hand.** They arrive through the URL plugin when another service asks StartOS for a Tor address, which is why the add and per-address delete actions are hidden.

**An install carrying onion addresses from an older StartOS imports them once.** If a migration file is present, init derives each address from its key, writes the key material into place, and renames the file so it never runs twice. Keys that are not properly clamped are skipped rather than imported broken.

## Actions

Five actions: two hidden ones the plugin drives, and three for you.

### Add Onion Service / Delete Onion Service (hidden)

Not user-facing. These are the plugin's table actions — StartOS invokes them when a service is given or loses a Tor address, and they are what write and remove the key material.

- **Deleting is permanent.** The secret key is removed with the entry, so the `.onion` address can never be recovered or reassigned.

### Delete Onion Addresses

Lists every `.onion` address in `torrc` with the package and host it belongs to, marks the ones no longer attached to an interface, and deletes the selected entries with their key material.

- **When to run it:** an address has to go and no interface page shows it — a service whose interface or port changed leaves its entry behind — or a relay-only server still logs the relay-and-hidden-service warning after every visible address is gone.
- **What it changes:** removes the entries from `torrc` and deletes their `hidden_services/` directories. Tor reloads when `torrc` changes.
- **Repeat safety:** deleting is permanent — the key is the address.
- **Availability: any status.**

### Configure Relay

Turns this node into a Tor relay or bridge, and sets its nickname, contact info, OR port, and bandwidth limits.

- **What it changes:** the `relay` section of `torrc`, and through it the presence of the OR interface.
- **Cost:** seconds, then a config reload — except that changing the OR port of a relay that is already on **restarts Tor**, interrupting every onion service for the time Tor takes to bootstrap. Tor tests an ORPort only when it starts as a relay or its address changes; reloaded onto a new port it keeps the old port's verdict, and would publish, and the Relay Reachability check would report as reachable, a port nothing has tested.
- **Repeat safety:** idempotent; the form is pre-filled.
- **Enabling a relay is not the whole job.** It creates the OR interface; the port reaches the internet only once its **Public** address is enabled — see Interfaces above. A relay whose reachability was never confirmed contributes nothing and publishes no descriptor. The Relay Reachability health check shows whether it has been confirmed.
- **A relay contributes your bandwidth to the network.** The relay is configured to never act as an exit.
- **Bandwidth rate and burst are in KB/s, and burst must be at least the rate.** Tor rejects a relay below 75 KB/s or a burst below the rate, so the form enforces both. The `torrc` lines may carry either `KBytes` or `MBytes`; both read back in KB/s.
- **The relay identity is separate from your onion addresses.** It lives under `keys/` and survives the recovery wipe, so a relay keeps its fingerprint and its accumulated reputation.
- **The relay shares the Tor process with the onion services.** Tor advises against that combination and logs `Tor is currently configured as a relay and a hidden service` whenever both are configured. A `HiddenServiceDir` exists only for an address attached to an interface, so a server meant to be a relay or bridge only clears the warning by removing its `.onion` addresses — the StartOS UI's included. An address no interface page shows any more is removed with **Delete Onion Addresses**.

### Reset Tor Connection

Clears Tor's cached view of the network and restarts it, so it picks new entry nodes.

- **When to run it:** Tor is stuck bootstrapping, or keeps dropping circuits. It is the manual form of what the watchdog does automatically.
- **What it changes:** it queues a wipe; the deletion happens at the next start, before any daemon exists.
- **Cost:** Tor is offline for a few minutes while it re-bootstraps.
- **Repeat safety:** safe to re-run.
- **Your `.onion` addresses are not affected**, nor is the relay identity — the wipe is an allow-list that preserves the torrc, the hidden-service keys, the relay keys, the control socket, and the watchdog state, and deletes everything else.
- **Availability: only while the service is running.**

## Tasks

None. This package raises no tasks, so the service is never held on a prompt and its ordinary controls are always available.

## Health Checks

Two checks. `tor` is also the recovery mechanism; `relay` only reports.

| Check   | Displayed            | Method                                                                  |
| ------- | -------------------- | ----------------------------------------------------------------------- |
| `tor`   | "Tor SOCKS Proxy"    | Tor's own control socket — bootstrap phase, circuit state, and dormancy |
| `relay` | "Relay Reachability" | Tor's own control socket — the result of the OR port self-test          |

The `tor` check reads Tor's real state rather than probing a port, so the message says what Tor is actually doing: a bootstrap percentage with Tor's own summary line while starting, and a distinct message for "bootstrapped but cannot build circuits". **Dormant counts as healthy** — Tor drops circuits when nothing has asked for one in a long time and wakes on the next request.

**It polls once a second while unhealthy instead of the default thirty**, because Tor bootstraps in seconds and a thirty-second poll left the UI showing 0% long after Tor had finished.

### The watchdog

Tor pins an entry node and keeps retrying it — deliberately, to resist guard-discovery attacks — so an entry node that goes bad leaves Tor wedged, and a plain restart does not help because the choice is on disk. The health check escalates instead:

1. **Five minutes unhealthy** with no movement in the bootstrap percentage, and it drops the pinned guards and open circuits over the control socket. Any change in the percentage restarts that clock, so a slow start is not mistaken for a wedge.
2. **Twice more**, ten and then twenty minutes apart.
3. **Then it wipes** the cached network state and restarts, so Tor re-selects from scratch. The wipe is queued and applied at the next start, because a running Tor holds this state in memory and would write the same entry nodes straight back.
4. **It wipes at most once per outage.** If Tor is still broken afterwards the cause is not stale state — most likely the server has no working internet — and the check says so and stops rather than restarting in a loop.

A healthy reading resets the whole ladder.

### Relay reachability

Disabled while relay mode is off. With relay mode on it asks Tor every 30 seconds for `status/reachability-succeeded/or` (Tor's own test of the OR port from outside, the same test that gates publishing the relay descriptor), `status/accepted-server-descriptor`, and `address/v6`.

- **Success:** Tor has confirmed the OR port is reachable from the internet, and a directory authority has accepted the relay's descriptor. Both are required because Tor's reachability flag reads true until it has built a descriptor at all.
- **Loading** for the first 20 minutes of unreachable readings, which is as long as Tor itself waits before warning — or 45 minutes when Tor knows an IPv6 address, because Tor keeps reporting the OR port unreachable until one of its 20-minute checks drops an unreachable auto-discovered IPv6 address and publishes over IPv4 alone. The clock starts at the first unreachable reading, so turning relay mode on in a running Tor gets the same allowance as a restart, and it starts over whenever the OR port or the advertised address changes, because Tor then tests from scratch.
- **Failure, at once,** while no public address is enabled on the OR Port interface: nothing can reach the relay, whatever Tor reports. This is checked against the binding because Tor never revisits a test it has passed until its address changes, so its own verdict stays true after the Public address is turned off.
- **Failure** after the allowance otherwise: the inbound path is missing, or it is on a gateway the relay does not advertise — see [Network Access and Interfaces](#network-access-and-interfaces). Restarting Tor or running **Reset Tor Connection** does not change it.

The check only reads state; it never restarts the service.

## Backups and Restore

Only the `tor` volume is copied — `sdk.Backups.ofVolumes('tor')`.

- **Included:** the hidden-service keys, the relay identity, `torrc`, and Tor's caches.
- **This backup contains the private keys behind every `.onion` address on the server.** Anyone holding it can impersonate those addresses. Treat it accordingly.
- **Not included:** the `startos` volume, which only ever holds a one-time import file.
- **Restore:** the addresses come back, because the keys do. Onion entries whose target service is not installed on the restored server are pruned on the first start, and their keys deleted with them. A service restored in the same batch counts as installed from the moment the restore begins, whichever of the two comes up first; one you mean to restore later does not — restore Tor alongside the services that own its addresses, or after them, never before.

## Limitations and Differences

1. **`torrc` is generated and hand edits do not survive.** The annotation comments in it are structural, not documentation.
2. **Onion services are not added by hand.** They come from other services through the URL plugin; the actions that create them are hidden.
3. **Deleting an onion service is irreversible** — the key is the address.
4. **Onion entries whose target package is gone are pruned automatically**, key material included. A host missing from a package that is still installed keeps its entry, unexported, until the host is back or **Delete Onion Addresses** removes it.
5. **An onion whose interface has no bridge-reachable address at all is logged, not repaired** — there is nothing to point it at, so the address has to be re-added once the interface is back, or deleted with **Delete Onion Addresses**.
6. **The SOCKS proxy is not exported** and is reachable only over loopback and the LXC bridge, never the LAN.
7. **The relay never acts as an exit.**
8. **The `tor` health check can restart the service on its own.** That is the watchdog working as intended, not a fault.
9. **The relay and the onion services run in one Tor process**, which Tor warns about whenever both are configured. A relay-only server is one with no `.onion` addresses; **Delete Onion Addresses** lists every one, attached to an interface or not.
10. **With the Public address enabled on more than one gateway, the relay's address is not pinned.** Tor advertises the address its outbound traffic comes from, and that has to be one of those gateways.
11. **The package never gives the relay an IPv6 address**, and `torrc` hand edits do not survive. The relay advertises IPv6 only if a public IPv6 address is enabled and Tor discovers it on its own.

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
  startos: host side (one-time onion-address import)
file_models:
  - /var/lib/tor/torrc # custom serializer/parser; annotation comments are structural
flag_files: # present = set
  - /var/lib/tor/.wipe-requested
  - /var/lib/tor/.auto-wiped
startos_managed_env_vars: []
dependencies: []
interfaces:
  or: { type: p2p, port: 9001 } # only while a relay is enabled; port is configurable
actions:
  - add-onion-service # hidden; driven by the url-v0 plugin
  - delete-onion-service # hidden; driven by the url-v0 plugin
  - delete-onion-addresses
  - configure-relay
  - reset-connection # only-running
tasks: []
health_checks:
  - tor # displayed "Tor SOCKS Proxy"; also the self-recovery watchdog
  - relay # displayed "Relay Reachability"; disabled unless relay mode is on
```

> **For dependent packages:** the SOCKS proxy is an unexported binding on host
> `socks`, port 9050. Import `socksHostId` and `socksPort` from
> `tor-startos/startos/utils` rather than hardcoding either — sixteen packaging
> repos already do, and nothing in this repo references them, so a rename here
> breaks all of them silently.
