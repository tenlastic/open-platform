#/usr/bin/env bash
set -e

# Create the PostgreSQL namespace.
kubectl apply -f ./kubernetes/objects/postgresql/namespace.yml

# Install PostgreSQL Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade postgresql stable/postgresql \
  --install \
  --namespace "postgresql" \
  --values "./helm/values/postgresql.yml"

# Install PostgreSQL Dashboards.
kubectl apply -f ./kubernetes/objects/postgresql/
