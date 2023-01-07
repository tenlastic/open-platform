#!/bin/bash
set -e

git branch --contains "${REVISION}" --remotes | tail +2 | cut -c 3-