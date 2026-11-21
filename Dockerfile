FROM --platform=$BUILDPLATFORM golang:1.27.4-alpine3.23 AS transports
ARG LYREBIRD_VERSION=0.10.0
ARG LYREBIRD_COMMIT=59ac7e400c384773f5584dbe366516ad04a33d9f
ARG SNOWFLAKE_VERSION=v2.15.4
ARG SNOWFLAKE_COMMIT=1c644981fb5628880eb7d66baa8099a02aad4052
RUN apk add --no-cache git
WORKDIR /src
RUN git clone --depth 1 --branch "$LYREBIRD_VERSION" https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/lyrebird.git \
 && test "$(git -C lyrebird rev-parse HEAD)" = "$LYREBIRD_COMMIT" \
 && git clone --depth 1 --branch "$SNOWFLAKE_VERSION" https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/snowflake.git \
 && test "$(git -C snowflake rev-parse HEAD)" = "$SNOWFLAKE_COMMIT"
ARG TARGETOS
ARG TARGETARCH
RUN cd lyrebird && CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags "-s -w -X main.lyrebirdVersion=$LYREBIRD_VERSION" -o /out/lyrebird ./cmd/lyrebird \
 && cd ../snowflake && CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags "-s -w" -o /out/snowflake-client ./client

FROM alpine:3.23
ARG TOR_VERSION
RUN apk add --no-cache "tor=${TOR_VERSION}-r0" && sed -i 's|^\(tor:.*\):/sbin/nologin$|\1:/bin/sh|' /etc/passwd
COPY --from=transports /out/lyrebird /out/snowflake-client /usr/bin/
USER tor
ENTRYPOINT ["tor"]
CMD ["-f", "/etc/tor/torrc"]
