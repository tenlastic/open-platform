#!/bin/bash
set -e

# Load environment variables if file exists.
if [ -f ../../settings.sh ]; then
  source ../../settings.sh
fi

# Run migrations if script is present.
npm run --if-present migrations up

# Publish coverage report if flag is present.
COVERAGE_ARGUMENTS=""
if [[ $* =~ "--coverage" ]]; then
  COVERAGE_ARGUMENTS="nyc --nycrc-path ../../.nycrc"
fi

# Watch tests if flag is present.
WATCH_ARGUMENTS=""
if [[ $* =~ "--watch" ]]; then
  WATCH_ARGUMENTS="--watch --watch-extensions ts"
fi

export NODE_ENV="test"
export TS_NODE_PROJECT="./tsconfig.e2e.json"

$COVERAGE_ARGUMENTS \
  mocha \
  --exit \
  --recursive \
  --require ts-node/register \
  --reporter mocha-multi-reporters \
  --reporter-options configFile="../../mocha-multi-reporters.json" \
  $WATCH_ARGUMENTS \
  "e2e/**/*.ts"

