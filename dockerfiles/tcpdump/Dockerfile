FROM alpine:latest

RUN set -ex \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    tcpdump

USER root
WORKDIR /root

ENTRYPOINT ["tcpdump"]