#/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)

# Create the Redis namespace.
kubectl apply -f "${DIRNAME}/manifests/namespace.yml"

# Install Redis Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade redis stable/redis-ha \
  --install \
  --namespace "redis" \
  --values "${DIRNAME}/helm/values.yml"

# Install Redis manifests.
kubectl apply -f "${DIRNAME}/manifests/"
