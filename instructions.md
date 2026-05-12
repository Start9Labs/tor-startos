# Tor

You've installed Tor — for most StartOS users this package does its work in the background. Other services that expose `.onion` addresses do so through Tor; you only need to come back here when you want to run a relay or bridge, or to attach an onion address to a URL by hand.

## Documentation

- [Tor onion service guide](https://community.torproject.org/onion-services/) — the upstream guide to onion services and operator-grade configuration.
- [Tor Project home](https://www.torproject.org/) — about the project, its goals, and how the network works.
- [Tor upstream source](https://gitlab.torproject.org/tpo/core/tor/) — the canonical repository for the Tor daemon.
- [Donate to the Tor Project](https://donate.torproject.org/) — support the people who maintain it.

## What you get on StartOS

- A running Tor daemon with a **SOCKS5 proxy** on `127.0.0.1:9050`, used internally by StartOS so other services can reach `.onion` destinations.
- **Automatic `.onion` addresses** for any other StartOS service that exposes a network interface — provisioned through the URL plugin without manual setup.
- Optional **relay or bridge mode** to contribute capacity to the Tor network.

## Getting set up

There is no setup wizard. After install, Tor starts on its own and your other services can immediately reach `.onion` destinations and be reached at their own `.onion` addresses.

To run as a relay or bridge:

1. Open Tor's **Actions** menu and run **Configure Relay**.
2. Toggle **Enabled**, then set a nickname, contact info, OR port, and bandwidth rate / burst.
3. Save. The OR port appears under **Interfaces** as **Tor Relay OR Port** once relay mode is on.

## Using Tor

### Automatic onion addresses

Other StartOS packages declare which of their interfaces should also be exposed over Tor; this package provisions and manages the underlying hidden service for them. These addresses appear and disappear with the interface they're attached to — you don't add or remove them through Tor directly.

### Actions

- **Add Onion Service** — manually attach an additional `.onion` address to a URL, with optional SSL and an optional vanity ed25519 private key.
- **Delete Onion Service** — remove an onion address that was added manually.
- **Configure Relay** — turn relay mode on or off and adjust nickname, contact, OR port, bridge mode, and bandwidth limits.

### Interfaces

- **Tor Relay OR Port** — only present when relay mode is enabled; the port other Tor relays connect to.

## Limitations

- Bandwidth in relay mode is bounded by your host and uplink; setting an unrealistically high rate won't give you more.
- A vanity onion address generated outside StartOS must be imported as a base64 ed25519 expanded private key.
- Onion-service keys live on the `tor` volume and are included in package backups; treat those backups as sensitive material.
