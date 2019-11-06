#!/usr/bin/env bash
set -e

if [ -n $1 ]; then
  ng build --configuration=$1 --output-path="./dist/$1" --preserve-symlinks --prod
else
  ng build --preserve-symlinks --prod
fi
