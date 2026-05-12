# Tor

You've installed Tor — it lets the rest of StartOS make outbound requests over the Tor network and lets you attach a `.onion` address to any interface of any other installed service.

## Documentation

- [Tor onion service guide](https://community.torproject.org/onion-services/) — the upstream guide to onion services and operator-grade configuration.

## What you get on StartOS

- A running Tor daemon with a **SOCKS5 proxy** on `127.0.0.1:9050` that other StartOS services use to reach `.onion` destinations.
- The ability to **add a `.onion` address to any interface of any other installed service**, optionally with your own vanity key.
- Optional **relay or bridge mode** to contribute capacity to the Tor network.

## Using Tor

### Adding a .onion address to another service

Open the other service's **Interfaces** panel and add a Tor address there. You can supply a base64 ed25519 expanded private key for a vanity address, or leave that blank and StartOS will generate a fresh key. The `.onion` lives with the service whose interface you attached it to — it appears and disappears with that interface.

### Running a relay or bridge

1. Open Tor's **Actions** menu and run **Configure Relay**.
2. Toggle **Enabled**, then set a nickname, contact info, OR port, and bandwidth rate / burst. For a bridge, enable **Bridge Mode**.
3. Save. The OR port shows up under **Interfaces** as **Tor Relay OR Port** once relay mode is on.
