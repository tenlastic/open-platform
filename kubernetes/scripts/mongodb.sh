#/usr/bin/env bash
set -e

# Set up Istio sidecars.
kubectl create namespace mongodb
kubectl label namespace mongodb istio-injection=enabled \
  --overwrite

# Install MongoDB Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade mongodb stable/mongodb-replicaset \
  --install \
  --namespace "mongodb" \
  --values "./helm/values/mongodb.yml"

# Install MongoDB Dashboards.
kubectl apply -f ./kubernetes/objects/mongodb/
