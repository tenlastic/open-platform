#!/bin/bash
set -e

# Create Yarn Cache volume if it does not exist.
docker volume create yarncache

# Start Docker containers.
docker-compose -f ../../docker-compose.yml -f ./docker-compose.yml run --rm application $@
