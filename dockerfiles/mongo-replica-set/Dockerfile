FROM mongo:4

COPY ./entrypoint.sh ./entrypoint.sh
COPY ./healthcheck.sh ./healthcheck.sh

EXPOSE 27017 27018 27019
HEALTHCHECK --interval=1s --retries=30 CMD ["/bin/bash", "./healthcheck.sh"]

ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]
