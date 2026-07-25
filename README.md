<p align="center">
  <img src="icon.svg" alt="Tor Logo" width="21%">
</p>

# Tor on StartOS

> **Upstream docs:** <https://community.torproject.org/onion-services/>
>
> Everything not listed in this document should behave the same as upstream
> Tor. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable.

Anonymity network for onion services and private browsing. Run onion services
(.onion addresses) to make your installed apps accessible over the Tor network.
Provides a SOCKS5 proxy for private browsing and can optionally operate as a
Tor relay or bridge to support the network.

- **Upstream repo:** <https://gitlab.torproject.org/tpo/core/tor/>
- **Wrapper repo:** <https://github.com/Start9Labs/tor-startos/>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [URL Plugin](#url-plugin)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                    |
| ------------- | ---------------------------------------- |
| Base image    | Alpine Linux with upstream `tor` package |
| Architectures | x86_64, aarch64, riscv64                 |
| Entrypoint    | `tor -f /var/lib/tor/torrc`              |
| User          | `tor` (non-root)                         |

The image is minimal -- just Alpine + the `tor` package. No custom patches
or modifications to the Tor binary.

---

## Volume and Data Layout

| Volume    | Mount Point    | Contents                                               |
| --------- | -------------- | ------------------------------------------------------ |
| `tor`     | `/var/lib/tor` | Tor data directory, onion service keys, control socket |
| `startos` | (internal)     | Migration data (onion-migration.json)                  |

The `torrc` configuration file is stored on the `tor` volume and is the single
source of truth for all onion service and relay settings. It is generated from
structured data and round-trips cleanly (metadata is embedded as `# @service`,
`# @ssl`, and `# @internalPort` comment annotations).

Onion service keys are stored under
`/var/lib/tor/hidden_services/<packageId>/<hostId>/hs_<index>/`. The StartOS
admin UI is addressed like any other service, as `start-os`/`admin` (StartOS
0.4.0-beta.10 migrates the legacy `STARTOS`/`startos-ui` entries and key
directories itself).

---

## Installation and First-Run Flow

1. No setup wizard or credentials -- Tor starts immediately with a SOCKS5
   proxy on port 9050.
2. Onion services are added via the URL plugin (see below) or the Configure
   Relay action.
3. On upgrade from a previous StartOS version, existing .onion addresses are
   migrated automatically from `onion-migration.json`.

---

## Configuration Management

All configuration is managed through StartOS actions and the URL plugin.
There is no upstream configuration UI.

| Setting               | Managed By | Method                                |
| --------------------- | ---------- | ------------------------------------- |
| Onion services        | URL plugin | Add/remove via service interface URLs |
| Relay/bridge settings | Action     | Configure Relay                       |
| SOCKS proxy port      | Hardcoded  | Always `0.0.0.0:9050`                 |
| Data directory        | Hardcoded  | Always `/var/lib/tor`                 |
| Control socket        | Hardcoded  | `/var/lib/tor/control.sock`           |
| Exit relay            | Hardcoded  | Always disabled                       |

---

## Network Access and Interfaces

### SOCKS5 Proxy

- **Port:** 9050
- **Protocol:** SOCKS5
- **Purpose:** Private browsing proxy for other services on the network
- **Binding:** StartOS host binding on port 9050 with **no exported interface**,
  so it is reachable only on the internal LXC bridge — other services dial the
  stable address `10.0.3.1:9050` (`await sdk.getOsIp(effects)` + the `socksPort`
  const exported from `startos/utils.ts`), never the LAN. Because the address
  never changes, dependents need no reactive watch on Tor and do not restart
  when Tor is installed, updated, or removed.

### Relay OR Port (conditional)

- **Port:** Configurable (default 9001)
- **Protocol:** Tor OR protocol
- **Purpose:** Relay traffic for the Tor network
- **Only exposed when relay mode is enabled** via the Configure Relay action

---

## Actions (StartOS UI)

### Configure Relay

- **ID:** `configure-relay`
- **Visibility:** Enabled (user-facing)
- **Purpose:** Configure Tor relay and bridge settings
- **Availability:** Any status
- **Inputs:**
  - **Enabled** -- toggle relay on/off (default: off)
  - **Nickname** -- 1-19 alphanumeric characters (default: "StartOSRelay")
  - **Contact Info** -- optional operator email
  - **Bridge Mode** -- toggle bridge relay (default: off)
  - **OR Port** -- 1-65535 (default: 9001)
  - **Bandwidth Rate** -- integer in MB/s (default: 1)
  - **Bandwidth Burst** -- integer in MB/s (default: 2)
- **Note:** Exit relay is always disabled. This package only supports
  non-exit relays and bridges.

### Add Onion Service (hidden)

- **ID:** `add-onion-service`
- **Visibility:** Hidden (invoked by the URL plugin, not directly by users)
- **Purpose:** Add a Tor onion service for a specific service interface URL
- **Inputs:**
  - **SSL** -- whether to serve with SSL (hidden if interface doesn't support it)
  - **Address** -- choose an existing .onion address or create a new one
  - **Private Key** -- optional base64-encoded ed25519 key for vanity .onion
    addresses (only shown when creating a new address)

### Delete Onion Service (hidden)

- **ID:** `delete-onion-service`
- **Visibility:** Hidden (invoked by the URL plugin)
- **Purpose:** Remove a specific port binding from an onion service; deletes
  the entire .onion address and keys if no port bindings remain

---

## URL Plugin

Tor registers as a `url-v0` plugin, which integrates with the StartOS
interface URL system. This allows users to add/remove .onion addresses for
any service's interface directly from the service's URL table.

- **Table action:** `add-onion-service` -- appears in the URL table for all services
- **Remove action:** `delete-onion-service` -- attached to each exported .onion URL
- **Stale cleanup:** On init, entries referencing interfaces that no longer
  exist are automatically removed along with their key material

---

## Backups and Restore

- **Backed up:** Entire `tor` volume (onion service keys, torrc, relay state)
- **Restore behavior:** Volume-level restore; onion service keys are preserved,
  so .onion addresses survive backup/restore cycles.
- **Uninstall warning:** Uninstalling Tor permanently deletes all onion
  service keys and .onion addresses.

---

## Health Checks

- **Method:** Connects to Tor's Unix control socket and queries
  `GETINFO status/bootstrap-phase`
- **States:**
  - **Loading** -- "Bootstrapping: X% - summary" (shown during startup)
  - **Success** -- "Tor is running" (bootstrap reached 100%)
  - **Failure** -- "Tor is not ready" (control socket unreachable or timeout)
- **Timeout:** 5 seconds per check

---

## Dependencies

None.

---

## Limitations and Differences

1. **No exit relay support.** `ExitRelay 0` is always set. This package only
   supports non-exit relays and bridges.
2. **No Tor Browser.** This package runs the Tor daemon only, not Tor Browser.
3. **SOCKS port is fixed** at 9050 and cannot be changed via the UI.
4. **No stream isolation** configuration is exposed.
5. **No pluggable transports** (obfs4, snowflake, etc.) are included in the
   Alpine image.

---

## What Is Unchanged from Upstream

- Tor binary is the upstream Alpine package, unmodified
- Onion service v3 protocol behavior
- SOCKS5 proxy protocol and behavior
- Relay and bridge protocol behavior
- Tor directory authority connections
- Automatic circuit building and path selection

## Contributing

Build and development workflow follow the StartOS packaging guide: <https://docs.start9.com/packaging>. Keep `README.md`, `instructions.md`, and `AGENTS.md` in sync with any change to user-visible behavior or package structure.

---

## Quick Reference for AI Consumers

```yaml
package_id: tor
image: Alpine Linux + tor package
architectures: [x86_64, aarch64, riscv64]
volumes:
  tor: /var/lib/tor
  startos: migration data
ports:
  socks: 9050
  or: 9001 (conditional, relay mode only)
dependencies: none
plugins: [url-v0]
startos_managed_config:
  - torrc (generated from structured data, round-trips via comment annotations)
actions:
  - configure-relay (user-facing)
  - add-onion-service (hidden, URL plugin)
  - delete-onion-service (hidden, URL plugin)
languages: [en_US, es_ES, de_DE, pl_PL, fr_FR]
```
