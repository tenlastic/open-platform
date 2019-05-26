#/usr/bin/env bash
set -e

DIR=$(dirname $0)

# Create the Grafana namespace.
kubectl apply -f "${DIRNAME}/manifests/namespace.yml"

# Create the Grafana administrator account secret.
kubectl apply -f "${DIRNAME}/manifests/admin-credentials.secret.yml"

# Install Grafana Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade grafana stable/grafana \
  --install \
  --namespace "grafana" \
  --values "${DIRNAME}/helm/values.yml"

# Install Grafana manifests.
kubectl apply -f "${DIRNAME}/manifests/"

# Create dashboards.
"${DIRNAME}/dashboards.sh"
