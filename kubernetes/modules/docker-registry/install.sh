#!/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)

# Create the Docker Registry namespace.
kubectl apply -f "${DIRNAME}/manifests/namespace.yml"

# Install Docker Registry Helm chart.
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm upgrade docker-registry stable/docker-registry \
  --install \
  --namespace "docker-registry" \
  --values "${DIRNAME}/helm/values.yml"

# Install Docker Registry Dashboards.
kubectl apply -f "${DIRNAME}/manifests/"
