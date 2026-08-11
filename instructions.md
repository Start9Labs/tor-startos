# Tor

## Documentation

- [Tor onion service guide](https://community.torproject.org/onion-services/) — the upstream guide to onion services and operator-grade configuration.

## What you get on StartOS

- A running Tor daemon with a **SOCKS5 proxy** on port 9050 that other StartOS services reach over the internal bridge to connect to `.onion` destinations.
- The ability to **add a `.onion` address to any interface of any other installed service**, optionally with your own vanity key.
- Optional **relay or bridge mode** to contribute capacity to the Tor network.
- **Automatic recovery** when Tor gets stuck on a bad entry node, plus a **Reset Tor Connection** action to fix it yourself.

## Warnings

- **Uninstalling Tor permanently deletes all onion service keys and `.onion` addresses.** Any service reachable through one of those addresses will lose it. Make a backup first if you want to keep your addresses.

## Using Tor

### Adding a .onion address to another service

Open the specific interface of the other service you want to expose over Tor. On that interface's page you'll find a **Tor** table; from there you can add or remove hidden services for that interface. When adding one you can supply a base64 ed25519 expanded private key for a vanity address, or leave that blank and StartOS will generate a fresh key. The `.onion` lives with the interface you attached it to — it appears and disappears with that interface. You can add an SSL or a non-SSL onion; an interface that terminates its own TLS (SSL-only) can only take an SSL onion, since it has no plaintext endpoint to forward to.

### Tor is stuck connecting

Tor enters the network through a small set of **entry nodes**, and it sticks with the ones it picked on purpose — hopping between entry points would make you easier to track. The downside is that if one of them goes bad, Tor keeps retrying it anyway: it stalls partway through connecting, or it connects but nothing loads. **Restarting Tor does not fix this**, because the entry node it picked is saved to disk and chosen again on the next start.

Tor now fixes this on its own. If it can't connect for a few minutes it switches entry nodes, and if that isn't enough it clears its saved network data and restarts so it starts fresh. Tor's health status tells you where it is while this happens.

To fix it yourself without waiting, open Tor's **Actions** menu and run **Reset Tor Connection**. Tor clears the network data it has saved and restarts, then reconnects with new entry nodes — give it a few minutes before it's usable again.

Your `.onion` addresses are never affected, by either route.

If Tor still can't connect after a reset, its health status will say so, and the problem is almost certainly your server's internet connection rather than Tor itself.

### Running a relay or bridge

1. Open Tor's **Actions** menu and run **Configure Relay**.
2. Toggle **Enabled**, then set a nickname, contact info, OR port, and bandwidth rate / burst. For a bridge, enable **Bridge Mode**.
3. Save. The OR port shows up under **Interfaces** as **Tor Relay OR Port** once relay mode is on.
