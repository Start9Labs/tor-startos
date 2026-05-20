# Updating the upstream version

Tor is not pinned in this repo — it is installed via `apk add tor` from the Alpine base image, so the shipped Tor version is whatever the `Dockerfile`'s Alpine tag currently carries. Bumping Tor therefore means either (a) Alpine has published a new `tor` package within the current Alpine release and a rebuild will pick it up, or (b) we need to move to a newer Alpine base image to reach a newer Tor.

## Determining the upstream version

### Tor (canonical upstream)

Canonical home: <https://gitlab.torproject.org/tpo/core/tor>. Latest stable tag:

```
curl -fsSL 'https://gitlab.torproject.org/api/v4/projects/tpo%2Fcore%2Ftor/repository/tags?per_page=20' \
  | jq -r '.[].name' | grep -E '^tor-[0-9]+\.[0-9]+\.[0-9]+$' | head -n1
```

No version is pinned in this repo — there is no Tor tag, ARG, or `TOR_VERSION` variable to read. Use this only to know what the newest stable Tor is so you can compare against what Alpine ships (next section).

### Tor as packaged by Alpine (what actually ships)

Tor is pulled in by `RUN apk add --no-cache tor` against the Alpine tag in the `Dockerfile`. To see which Tor version that resolves to for the currently pinned Alpine release, query the Alpine package index:

```
ALPINE_TAG=$(grep -oP '(?<=^FROM alpine:)[0-9.]+' Dockerfile)
curl -fsSL "https://pkgs.alpinelinux.org/package/v${ALPINE_TAG}/main/x86_64/tor" \
  | grep -oP '(?<=<th class="header">Version</th>\s<td>)[^<]+' | head -n1
```

(Or browse <https://pkgs.alpinelinux.org/packages?name=tor&branch=v${ALPINE_TAG}&arch=x86_64> directly.) That is the Tor version a fresh build will install. The pin lives implicitly in the Alpine base tag, not in a Tor-specific variable.

### Alpine base image

Canonical home: <https://hub.docker.com/_/alpine>. Latest published tags:

```
curl -fsSL 'https://hub.docker.com/v2/repositories/library/alpine/tags?page_size=20&ordering=last_updated' \
  | jq -r '.results[].name'
```

Pin lives in `Dockerfile` (`FROM alpine:<tag>`).

## Applying the bump

There are two distinct bumps; do whichever applies.

### Alpine has a newer Tor within the current Alpine release

Nothing in this repo needs to change to pick up the new Tor — `apk add tor` will resolve to the new version on the next image build. Update `startos/versions/index.ts` (`version` + `releaseNotes`) and rebuild.

### Need a newer Alpine to reach a newer Tor

Edit `Dockerfile`:

```
FROM alpine:<new-tag>
```

Then update `startos/versions/index.ts` (`version` + `releaseNotes`) and rebuild.
