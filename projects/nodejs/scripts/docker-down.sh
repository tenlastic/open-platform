#!/bin/bash
set -e

# Remove Docker containers.
docker-compose \
  -f ../../docker-compose.yml \
  -f ./docker-compose.yml \
  down
