#!/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)

# Create Service Account for Tiller.
kubectl apply -f "${DIRNAME}/manifests/"

# Install Tiller on Kubernetes cluster.
helm init \
  --history-max "200" \
  --service-account "tiller" \
  --upgrade \
  --wait
