#!/bin/bash
set -e

if [[ $* =~ "--watch" ]]; then
  ts-node-dev --esm --interval 10000 --poll --transpile-only ./src/entrypoint.ts $@
else
  ts-node --esm --transpile-only ./src/entrypoint.ts $@
fi
