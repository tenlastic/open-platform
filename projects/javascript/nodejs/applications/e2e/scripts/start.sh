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
export TS_NODE_PROJECT="./tsconfig.app.json"

$COVERAGE_ARGUMENTS \
  mocha \
    --exclude "src/**/*.spec.ts" \
    --exit \
    --require ts-node/register \
    --timeout 600000 \
    $WATCH_ARGUMENTS \
    "src/**/*.ts"
