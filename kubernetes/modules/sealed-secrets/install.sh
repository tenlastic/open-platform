#!/bin/bash
set -e

# Install Sealed Secrets Helm chart.
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.9.5/controller.yaml