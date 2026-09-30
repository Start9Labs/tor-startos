FROM alpine:3.23
ARG TOR_VERSION
RUN apk add --no-cache "tor=${TOR_VERSION}-r0" && sed -i 's|^\(tor:.*\):/sbin/nologin$|\1:/bin/sh|' /etc/passwd
USER tor
ENTRYPOINT ["tor"]
CMD ["-f", "/etc/tor/torrc"]
