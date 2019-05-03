#/usr/bin/env bash
set -e

# Install Redis Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm install stable/redis-ha \
  --name "redis" \
  --namespace "redis" \
  --values "./helm/values/redis.yml"
