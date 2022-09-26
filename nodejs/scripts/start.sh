#!/bin/bash
set -e

if [[ $* =~ "--watch" ]]; then
  ts-node-dev --interval 10000 --poll --respawn ./src/entrypoint.ts $@
else
  ts-node ./src/entrypoint.ts $@
fi
