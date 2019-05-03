#!/usr/bin/env bash
set -e

# Install the cert-manager CRDs. We must do this before installing the Helm
# chart in the next step for `release-0.7` of cert-manager:
kubectl apply -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.7/deploy/manifests/00-crds.yaml

# Add the Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io

# Updating the repo just incase it already existed
helm repo update

# Install the cert-manager helm chart
helm install jetstack/cert-manager \
  --name "cert-manager" \
  --namespace "cert-manager"

# Wait for install to finish.
echo "Waiting for install to finish..."
sleep 30

# Create GCP DNS Admin Secret.
kubectl create secret generic cert-manager-credentials \
 --from-file "gcp-dns-admin.json" \
 --namespace "cert-manager"

# Create Staging and Production Issuers.
kubectl apply -f ./kubernetes/cert-manager/
