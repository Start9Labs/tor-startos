# Tor

## Documentation

- [Tor onion service guide](https://community.torproject.org/onion-services/) — the upstream guide to onion services and operator-grade configuration.

## What you get on StartOS

- A running Tor daemon with a **SOCKS5 proxy** on port 9050 that other StartOS services reach over the internal bridge to connect to `.onion` destinations.
- The ability to **add a `.onion` address to any interface of any other installed service**, optionally with your own vanity key.
- Optional **relay or bridge mode** to contribute capacity to the Tor network.

## Requirements & upgrade notes

- **StartOS 0.4.0-beta.10 or later is required.** Onion services now reach their target apps over StartOS's internal LXC bridge instead of deprecated container hostnames, and the StartOS admin UI is addressed like any other service — both need the beta.10 backend. A side benefit: installing, updating, or removing Tor no longer restarts the services that depend on it (e.g. Bitcoin).
- **Uninstalling Tor permanently deletes all onion service keys and `.onion` addresses.** Any service reachable through one of those addresses will lose it. Make a backup first if you want to keep your addresses.

## Using Tor

### Adding a .onion address to another service

Open the specific interface of the other service you want to expose over Tor. On that interface's page you'll find a **Tor** table; from there you can add or remove hidden services for that interface. When adding one you can supply a base64 ed25519 expanded private key for a vanity address, or leave that blank and StartOS will generate a fresh key. The `.onion` lives with the interface you attached it to — it appears and disappears with that interface. You can add an SSL or a non-SSL onion; an interface that terminates its own TLS (SSL-only) can only take an SSL onion, since it has no plaintext endpoint to forward to.

### Running a relay or bridge

1. Open Tor's **Actions** menu and run **Configure Relay**.
2. Toggle **Enabled**, then set a nickname, contact info, OR port, and bandwidth rate / burst. For a bridge, enable **Bridge Mode**.
3. Save. The OR port shows up under **Interfaces** as **Tor Relay OR Port** once relay mode is on.
