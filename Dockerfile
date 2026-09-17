FROM alpine:3.23
RUN apk add --no-cache tor && sed -i 's|^\(tor:.*\):/sbin/nologin$|\1:/bin/sh|' /etc/passwd
USER tor
ENTRYPOINT ["tor"]
CMD ["-f", "/etc/tor/torrc"]
