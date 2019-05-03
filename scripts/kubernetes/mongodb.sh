#/usr/bin/env bash
set -e

# Create expandable Storage Class.
kubectl apply -f ./kubernetes/storage-classes/standard-expandable.yml

# Install MongoDB Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm install stable/mongodb-replicaset \
  --name "mongodb" \
  --namespace "mongodb" \
  --values "./helm/values/mongodb.yml"
