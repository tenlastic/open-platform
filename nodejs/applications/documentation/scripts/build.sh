#!/bin/bash
set -e

# Create the distribution directory.
mkdir -p ./dist/swagger/

# Merge API swagger files.
merge-yaml \
  -i ./src/api.yaml \
  ../../modules/mongoose/src/**/*.yaml \
  ../aggregation-api/src/web-server/**/swagger.yaml \
  ../api/src/web-server/**/swagger.yaml \
  ../namespace-api/src/web-server/**/swagger.yaml \
  ../social-api/src/web-server/**/swagger.yaml \
  -o ./dist/swagger/api.yaml

# Merge Web Socket swagger files.
merge-yaml \
  -i ./src/web-sockets.yaml \
  ../aggregation-api/src/web-socket-server/**/swagger.yaml \
  ../api/src/web-socket-server/**/swagger.yaml \
  ../namespace-api/src/web-socket-server/**/swagger.yaml \
  ../social-api/src/web-socket-server/**/swagger.yaml \
  -o ./dist/swagger/web-sockets.yaml

# Alphabetize Output.
yml-sorter --input ./dist/swagger/api.yaml
yml-sorter --input ./dist/swagger/web-sockets.yaml

# Convert to JSON.
yaml2json ./dist/swagger/api.yaml > ./dist/swagger/api.json
yaml2json ./dist/swagger/web-sockets.yaml > ./dist/swagger/web-sockets.json
