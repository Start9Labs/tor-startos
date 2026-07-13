# Updating the upstream version

Tor is not pinned in this repo — it is installed via `apk add tor` from the Alpine base image, so the shipped Tor version is whatever the `Dockerfile`'s Alpine tag currently carries. Bumping Tor therefore means either (a) Alpine has published a new `tor` package within the current Alpine release and a rebuild will pick it up, or (b) we need to move to a newer Alpine base image to reach a newer Tor.

## Determining the upstream version

### Tor (canonical upstream)

Canonical home: <https://gitlab.torproject.org/tpo/core/tor>. Latest stable tag:

```
curl -fsSL 'https://gitlab.torproject.org/api/v4/projects/tpo%2Fcore%2Ftor/repository/tags?per_page=20' \
  | jq -r '.[].name' | grep -E '^tor-[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -n1
```

Note the **four** version components — Tor versions are `0.4.9.11`, not `0.4.9`. A three-component regex matches nothing and the command silently prints an empty line. The filter also drops the `-alpha` / `-rc` / `-alpha-dev` tags, which are interleaved with the stable ones in the tag list; only a bare four-component tag is a stable release.

No version is pinned in this repo — there is no Tor tag, ARG, or `TOR_VERSION` variable to read. Use this only to know what the newest stable Tor is so you can compare against what Alpine ships (next section).

### Tor as packaged by Alpine (what actually ships)

Tor is pulled in by `RUN apk add --no-cache tor` against the Alpine tag in the `Dockerfile`. **`tor` lives in Alpine's `community` repository, not `main`.** To see which Tor version that resolves to for the currently pinned Alpine release, read the authoritative package index (`APKINDEX`) for that release:

```
ALPINE_TAG=$(grep -oP '(?<=^FROM alpine:)[0-9.]+' Dockerfile)
curl -fsSL "https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_TAG}/community/x86_64/APKINDEX.tar.gz" \
  | tar -xzO APKINDEX | grep -A1 '^P:tor$'
```

That prints `P:tor` / `V:<version>-r<rev>` — the exact version a fresh build will install. Equivalently, ask `apk` itself inside the base image:

```
docker run --rm alpine:${ALPINE_TAG} sh -c 'apk update -q && apk search -e tor'
```

The pin lives implicitly in the Alpine base tag, not in a Tor-specific variable.

> [!NOTE]
> The human-readable package browser lives at `https://pkgs.alpinelinux.org/package/v${ALPINE_TAG}/community/x86_64/tor` — note **`community`** in the path; the `main` path 404s, which is what made the old scrape in this doc fail. Don't scrape it either way: its HTML has since changed, so version-extracting `grep`s against it now come back empty rather than erroring. Use the `APKINDEX` or `apk` queries above.

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
