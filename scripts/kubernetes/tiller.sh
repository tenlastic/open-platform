#!/usr/bin/env bash
set -e

# Create Service Account for Tiller.
kubectl apply -f ./kubernetes/tiller/

# Install Tiller on Kubernetes cluster.
helm init \
  --history-max "200" \
  --service-account "tiller" \
  --wait
