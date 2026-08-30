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

Open the specific interface of the other service you want to expose over Tor. On that interface's page you'll find a **Tor** table; from there you can add or remove hidden services for that interface. When adding one you can supply a base64 ed25519 expanded private key for a vanity address, or leave that blank and StartOS will generate a fresh key. The `.onion` lives with the interface you attached it to — it appears and disappears with that interface. You can add an SSL or a non-SSL onion. The SSL toggle starts on for a service that is reachable only over SSL, and off for a web interface, since Tor already secures the connection and a certificate on a web interface's `.onion` only adds a browser warning. An interface that terminates its own TLS (SSL-only) can only take an SSL onion, since it has no plaintext endpoint to forward to.

Your `.onion` addresses look after themselves once they exist. If a service changes the port or the encryption it is served on, Tor re-points the address the next time it starts, so it keeps answering without you doing anything and the address itself never changes. An address whose interface has no reachable endpoint left is reported in the logs and otherwise left alone.

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
4. Open the **Tor Relay OR Port** interface and enable the **Public** address — on the same connection Tor uses for its outbound traffic, since that is the address your relay announces. Behind StartTunnel that is all; on a home connection, also forward the OR port on your router to your server.

Give Tor a few minutes, then check its logs: `Self-testing indicates your ORPort is reachable from the outside. Excellent.` means the relay is working, and it will appear in [Relay Search](https://metrics.torproject.org/rs.html) within a few hours. If the log instead keeps warning that reachability could not be confirmed, the port is not reaching your server — recheck which connection the Public address is enabled on and, on a home connection, your router's port forward. If you change the OR port later, or your public IP changes, enable the Public address again.
