#!/usr/bin/env bash
set -euo pipefail

# This script downloads and decodes all secrets in a specified Namespace.

NAMESPACE=${1:-}
DIRECTORY=${2:-.}

if [ -z "$DIRECTORY" ] || [ -z "$NAMESPACE" ]; then
  echo "Usage: $0 <namespace> <directory>"
  exit 1
fi

mkdir -p -- "$DIRECTORY"

# Get all secret names
secrets=$(kubectl get secrets -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')

for secret in $secrets; do
  echo "Exporting secret (decoded YAML): $secret"

  # Fetch the secret in JSON, decode .data, and convert to YAML
  kubectl get secret "$secret" -n "$NAMESPACE" -o json \
    | jq '{apiVersion: .apiVersion, kind: .kind, metadata: .metadata, type: .type, stringData: (.data // {} | map_values(@base64d))}' \
    | yq eval -P - > "${DIRECTORY%/}/${secret}.secret.yaml"
done

echo "✅ All secrets from namespace '$NAMESPACE' exported with decoded stringData to '$DIRECTORY'."
