FROM alpine:latest

RUN apk update && apk add --no-cache tcpdump

USER root
WORKDIR /root

ENTRYPOINT ["tcpdump"]