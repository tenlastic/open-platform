#!/bin/bash
set -e

# Start Docker containers.
docker-compose \
  -f ../../docker-compose.yml \
  -f ./docker-compose.yml run \
  --rm \
  --service-ports \
  application $@
