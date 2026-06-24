FROM alpine:3.22
RUN apk add --no-cache tor
USER tor
ENTRYPOINT ["tor"]
CMD ["-f", "/etc/tor/torrc"]
