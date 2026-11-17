# Updating the upstream version

The upstream version is `torVersion` in `startos/manifest/index.ts`. It supplies the Docker build's `TOR_VERSION` argument, and the Dockerfile installs that exact Alpine package version, including the `-r0` packaging revision. `startos/versions/current.ts` repeats it as the upstream component of a quoted `version` literal, which release CI reads, so the two must match.

## Determining the upstream version

### Tor (canonical upstream)

Canonical home: <https://gitlab.torproject.org/tpo/core/tor>. Latest stable tag:

```
curl -fsSL 'https://gitlab.torproject.org/api/v4/projects/tpo%2Fcore%2Ftor/repository/tags?per_page=20' \
  | jq -r '.[].name' | grep -E '^tor-[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -n1
```

Tor versions have four components. The filter selects stable tags and excludes prereleases.

### Tor as packaged by Alpine

Tor lives in Alpine's `community` repository. Check the package index for each supported architecture:

```
ALPINE_TAG=$(grep -oP '(?<=^FROM alpine:)[0-9.]+' Dockerfile)
for ARCH in x86_64 aarch64 riscv64; do
  echo "$ARCH"
  curl -fsSL "https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_TAG}/community/${ARCH}/APKINDEX.tar.gz" \
    | tar -xzO APKINDEX | grep -E -A1 '^P:tor$'
done
```

The `V:` line gives the exact version and Alpine packaging revision. The desired upstream release must be available for all three architectures before bumping. If its revision differs from `-r0`, update the Dockerfile's exact package selector too.

### Alpine base image

Canonical home: <https://hub.docker.com/_/alpine>. Latest published tags:

```
curl -fsSL 'https://hub.docker.com/v2/repositories/library/alpine/tags?page_size=20&ordering=last_updated' \
  | jq -r '.results[].name'
```

The base-image pin lives in `Dockerfile` (`FROM alpine:<tag>`). Move it when the desired Tor release requires a newer Alpine release, and only to one that publishes Tor for every supported architecture.

### Bridge transports and their Go toolchain

`lyrebird` and `snowflake-client` are built from upstream source in the Dockerfile's `transports` stage, not taken from Alpine: Alpine's builds can lag Go security fixes by months, and Go compiles the standard library's certificate checks into each binary. Each is pinned by tag and by the commit that tag must resolve to (`LYREBIRD_VERSION`/`LYREBIRD_COMMIT`, `SNOWFLAKE_VERSION`/`SNOWFLAKE_COMMIT`); the build fails if a tag has moved. Latest tags and their commits:

```
for P in lyrebird snowflake; do
  curl -fsSL "https://gitlab.torproject.org/api/v4/projects/tpo%2Fanti-censorship%2Fpluggable-transports%2F$P/repository/tags?per_page=3" \
    | jq -r '.[] | .name + " " + .commit.id'
done
```

The builder image (`FROM golang:<version>-alpine<alpine>`) must be at least the `go` line in each transport's `go.mod`. Keep it on the latest Go patch release, and rebuild whenever Go ships a `crypto/tls` or `crypto/x509` fix.

## Applying the bump

1. Verify Alpine publishes the desired Tor package for every supported architecture, and check the bridge transports and Go builder for newer releases.
2. Update `torVersion` in `startos/manifest/index.ts`, the upstream component of `version` in `startos/versions/current.ts`, and the Alpine packaging revision in the Dockerfile if needed.
