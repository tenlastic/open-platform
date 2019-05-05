#/usr/bin/env bash
set -e

# Create the Redis namespace.
kubectl apply -f ./kubernetes/objects/redis/namespace.yml

# Install Redis Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade redis stable/redis-ha \
  --install \
  --namespace "redis" \
  --values "./helm/values/redis.yml"

# Install Redis Dashboards.
kubectl apply -f ./kubernetes/objects/redis/
