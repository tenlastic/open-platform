#/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)

# Create the Flux namespace.
kubectl apply -f "${DIRNAME}/manifests/namespace.yml"

# Install Flux Helm chart.
helm repo add fluxcd https://fluxcd.github.io/flux
helm upgrade flux fluxcd/flux \
	--install \
	--namespace "flux" \
  --values "${DIRNAME}/helm/values.yml"
