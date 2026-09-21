# Tor

## Documentation

- [Tor onion service guide](https://community.torproject.org/onion-services/) — the upstream guide to onion services and operator-grade configuration.

## What you get on StartOS

- A running Tor daemon with a **SOCKS5 proxy** on port 9050 that other StartOS services reach over the internal bridge to connect to `.onion` destinations.
- The ability to **add a `.onion` address to any interface of any other installed service**, optionally with your own vanity key.
- **Automatic recovery** when Tor gets stuck connecting, which you can turn off, plus a **Reset Tor Connection** action to fix it yourself.

## Warnings

- **Uninstalling Tor permanently deletes all onion service keys and `.onion` addresses.** Any service reachable through one of those addresses will lose it. Make a backup first if you want to keep your addresses.
- **A `.onion` address outlives the service it belongs to.** Uninstalling a service leaves its addresses unused rather than deleting them, and installing it again brings them back. To get rid of one for good, use **Delete Unused Onion Addresses**.

## Using Tor

### Adding a .onion address to another service

Open the specific interface of the other service you want to expose over Tor. On that interface's page you'll find a **Tor** table; from there you can add or remove hidden services for that interface. When adding one you can supply a base64 ed25519 expanded private key for a vanity address, or leave that blank and StartOS will generate a fresh key. You can add an SSL or a non-SSL onion. The SSL toggle starts on for a service that is reachable only over SSL, and off for a web interface, since Tor already secures the connection and a certificate on a web interface's `.onion` only adds a browser warning. An interface that terminates its own TLS (SSL-only) can only take an SSL onion, since it has no plaintext endpoint to forward to.

Your `.onion` addresses look after themselves once they exist. If a service's ports move, the address follows them without you doing anything, and the address itself never changes.

If an update to a service removes the port an address was attached to, the address is kept. Open the interface you want it on, add a `.onion` address, and pick the existing address from the list instead of creating a new one.

### Removing a .onion address

Removing an address from an interface's **Tor** table detaches it; its key is kept, so you can attach the same address again later.

To delete addresses for good, open Tor's **Actions** menu and run **Delete Unused Onion Addresses**. It lists every `.onion` address that no interface is using — ones you detached, and ones whose service was uninstalled or no longer has the port — with all of them selected. Untick any you want to keep. Deleting is permanent — the key goes with the address.

### Restoring from a backup

Restore Tor and your other services in any order. Each address starts working again as soon as its service is back.

### Tor is stuck connecting

Sometimes Tor cannot connect, or connects but nothing loads, and **restarting it does not help**.

With **Automatic Recovery** on, which is the default, Tor repairs this by itself within the hour. Tor's health status tells you where it is while this happens.

To fix it yourself without waiting, open Tor's **Actions** menu and run **Reset Tor Connection**. Tor restarts and reconnects — give it a few minutes before it's usable again. Use it when Tor is stuck, not routinely.

Your `.onion` addresses are never affected, by either route.

If Tor still can't connect after a reset, its health status will say so, and the problem is almost certainly your server's internet connection rather than Tor itself.

### Choosing between staying reachable and staying hidden

**Automatic Recovery** is a trade-off, and the action that turns it on and off explains it each time you use it.

- **On (default):** your services stay reachable without your attention. The cost: someone able to repeatedly interrupt this server's internet connection, such as an internet provider, could use those repairs to eventually work out that your `.onion` addresses are hosted here.
- **Off (fail closed):** that is no longer possible. The cost: if Tor gets stuck, it stays offline, along with everything that depends on it, until you run **Reset Tor Connection**.

Leave it on unless hiding this server's location matters more to you than staying reachable.

### Adding your own Tor options

Tor's configuration file, `torrc`, has two parts. The top part is yours: options you add there are kept and Tor uses them. Everything below the marked line is written by StartOS and is replaced whenever your addresses change.

### Relays and bridges

This service no longer runs a Tor relay or bridge. A relay's IP address is public, and a server that both runs a relay and hosts `.onion` addresses can have the two linked. Relay support is planned to return as a separate service.
