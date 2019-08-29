#!/bin/bash
set -e

mongo \
  --quiet \
  --eval "
    quit(
      (
        (rs.status().members[0].state == 1 || rs.status().members[0].state == 2) &&
        (rs.status().members[1].state == 1 || rs.status().members[1].state == 2) &&
        (rs.status().members[1].state == 1 || rs.status().members[1].state == 2)
      ) ? 0 : 1
    )"
