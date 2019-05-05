#/usr/bin/env bash
set -e

# Create the MongoDB namespace.
kubectl apply -f ./kubernetes/objects/mongodb/namespace.yml

# Install MongoDB Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade mongodb stable/mongodb-replicaset \
  --install \
  --namespace "mongodb" \
  --values "./helm/values/mongodb.yml"

# Install MongoDB Dashboards.
kubectl apply -f ./kubernetes/objects/mongodb/
