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
- **Restore Tor together with the services that use its `.onion` addresses, or after them — never before.** Restored on its own, Tor treats an address whose service is not installed as abandoned and deletes its key. Selecting Tor and those services in the same restore is safe whichever order they come up in.

## Using Tor

### Adding a .onion address to another service

Open the specific interface of the other service you want to expose over Tor. On that interface's page you'll find a **Tor** table; from there you can add or remove hidden services for that interface. When adding one you can supply a base64 ed25519 expanded private key for a vanity address, or leave that blank and StartOS will generate a fresh key. The `.onion` lives with the interface you attached it to — it appears and disappears with that interface. You can add an SSL or a non-SSL onion. The SSL toggle starts on for a service that is reachable only over SSL, and off for a web interface, since Tor already secures the connection and a certificate on a web interface's `.onion` only adds a browser warning. An interface that terminates its own TLS (SSL-only) can only take an SSL onion, since it has no plaintext endpoint to forward to.

Your `.onion` addresses look after themselves once they exist. If a service changes the port or the encryption it is served on, Tor re-points the address the next time it starts, so it keeps answering without you doing anything and the address itself never changes. An address whose interface has no reachable port left stops answering until the port is back; it keeps its key, so it returns unchanged.

### Removing a .onion address that no longer shows anywhere

An address stays with the interface it was attached to. If that service changed its interface or port, or was reinstalled differently, the address drops off every interface page and stops answering, but its key stays until you delete it. Open Tor's **Actions** menu and run **Delete Onion Addresses**: it lists every `.onion` address the server hosts, marks the ones no longer attached to an interface, and deletes the ones you pick. Deleting is permanent — the key goes with the address.

### Tor is stuck connecting

Tor enters the network through a small set of **entry nodes**, and it sticks with the ones it picked on purpose — hopping between entry points would make you easier to track. The downside is that if one of them goes bad, Tor keeps retrying it anyway: it stalls partway through connecting, or it connects but nothing loads. **Restarting Tor does not fix this**, because the entry node it picked is saved to disk and chosen again on the next start.

Tor now fixes this on its own. If it can't connect for a few minutes it switches entry nodes, and if that isn't enough it clears its saved network data and restarts so it starts fresh. Tor's health status tells you where it is while this happens.

To fix it yourself without waiting, open Tor's **Actions** menu and run **Reset Tor Connection**. Tor clears the network data it has saved and restarts, then reconnects with new entry nodes — give it a few minutes before it's usable again.

Your `.onion` addresses are never affected, by either route.

If Tor still can't connect after a reset, its health status will say so, and the problem is almost certainly your server's internet connection rather than Tor itself.

### Running a relay or bridge

1. Open Tor's **Actions** menu and run **Configure Relay**.
2. Toggle **Enabled**, then set a nickname, contact info, OR port, and bandwidth rate / burst in KB/s (Tor needs at least 75 KB/s, and the burst must be at least the rate). For a bridge, enable **Bridge Mode**.
3. Save. The OR port shows up under **Interfaces** as **Tor Relay OR Port** once relay mode is on.
4. Open the **Tor Relay OR Port** interface and enable the **Public** address on the connection you want your relay to use. Behind StartTunnel that is all. On a home connection StartOS asks your router to open the port; if your router doesn't allow that, forward the OR port to your server yourself.

Tor's **Relay Reachability** health status shows when the Tor network can reach your relay. The first test takes up to 20 minutes; once it passes, the relay appears in [Relay Search](https://metrics.torproject.org/rs.html) within a few hours. If it says the relay isn't reachable, the port isn't reaching your server: check that the Public address is still enabled and, on a home connection, your router. Keep the Public address enabled on just one connection — with more than one, your relay announces whichever of them Tor's outgoing traffic uses. If you change the OR port later, or your public IP changes, enable the Public address again. Changing the OR port while the relay is on restarts Tor so that it tests the new port, which briefly interrupts your `.onion` addresses.

Tor advises against running a relay and `.onion` addresses in the same Tor process, and logs a warning whenever both are configured. If this server is meant to be a relay or bridge only, remove the `.onion` addresses from your services — the StartOS UI's included, under **System** — and the warning goes away. **Delete Onion Addresses** in Tor's **Actions** menu shows every address Tor holds, including any that no longer appears on an interface page.
