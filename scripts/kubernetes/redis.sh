#/usr/bin/env bash
set -e

# Create expandable Storage Class.
kubectl apply -f ./kubernetes/storage-classes/standard-expandable.yml

# Install Redis Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm install stable/redis-ha \
  --name "redis" \
  --namespace "redis" \
  --values "./helm/values/redis.yml"
