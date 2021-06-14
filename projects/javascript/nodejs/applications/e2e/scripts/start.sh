#!/bin/bash
set -e

export TS_NODE_PROJECT="./tsconfig.app.json"

mocha \
  --exclude "./src/**/*.spec.ts" \
  --exit \
  --require ts-node/register \
  --timeout 600000 \
  "./src/**/*.ts"
