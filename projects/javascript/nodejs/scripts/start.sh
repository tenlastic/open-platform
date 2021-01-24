#!/bin/bash
set -e

if [[ $* =~ "--watch" ]]; then
  ts-node-dev --interval 1000 --poll ./src/index.ts $@
else
  ts-node ./src/index.ts $@
fi
