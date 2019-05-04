#/usr/bin/env bash
set -e

# Set up Istio sidecars.
kubectl create namespace redis
kubectl label namespace redis istio-injection=enabled \
  --overwrite

# Install Redis Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade redis stable/redis-ha \
  --install \
  --namespace "redis" \
  --values "./helm/values/redis.yml"

# Install Redis Dashboards.
kubectl apply -f ./kubernetes/objects/redis/
