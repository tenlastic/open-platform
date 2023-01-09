#!/bin/bash
set -e

if [[ $* =~ "--watch" ]]; then
  ts-node-dev --interval 10000 --poll --respawn --transpile-only ./src/entrypoint.ts $@
else
  ts-node --transpile-only ./src/entrypoint.ts $@
fi
