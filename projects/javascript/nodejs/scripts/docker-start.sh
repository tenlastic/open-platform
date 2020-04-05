#!/bin/bash
set -e

docker-compose up -d --scale "application=0"
lerna run --loglevel "silent" --scope "@tenlastic/*-api" --stream docker -- start &> /dev/null