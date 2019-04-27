#!/usr/bin/env bash
set -e

ISTIO_VERSION=1.1.3

# Download Istio.
curl -L https://git.io/getLatestIstio | sh -
mv istio-${ISTIO_VERSION}/ istio/
