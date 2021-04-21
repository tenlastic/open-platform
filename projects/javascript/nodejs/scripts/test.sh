#!/bin/bash
set -e

# Publish coverage report if flag is present.
COVERAGE_ARGUMENTS=""
if [[ $* =~ "--code-coverage" ]]; then
  COVERAGE_ARGUMENTS="nyc --nycrc-path ../../.nycrc"
fi

# Watch tests if flag is present.
WATCH_ARGUMENTS=""
if [[ $* =~ "--watch" ]]; then
  WATCH_ARGUMENTS="--watch --watch-extensions ts"
fi

export NODE_ENV="test"
export TS_NODE_PROJECT="./tsconfig.spec.json"

$COVERAGE_ARGUMENTS \
  mocha \
  --exit \
  --require ts-node/register \
  --reporter mocha-multi-reporters \
  --reporter-options configFile="../../mocha-multi-reporters.json" \
  --timeout 10000 \
  $WATCH_ARGUMENTS \
  "src/**/*.spec.ts"
