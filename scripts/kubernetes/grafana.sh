#!/usr/bin/env bash

# Enter the Istio directory.
cd istio/

# Calculate difference to enable Grafana dashboard.
helm template --set grafana.enabled=false --namespace istio-system install/kubernetes/helm/istio > ./off.yaml
helm template --set grafana.enabled=true --namespace istio-system install/kubernetes/helm/istio > ./on.yaml
diff --line-format=%L ./on.yaml ./off.yaml > grafana.yaml

# Remove intermediate files.
rm ./off.yaml
rm ./on.yaml

# Apply differences.
kubectl apply -f ./grafana.yaml

# Remove intermediate file.
rm ./grafana.yaml
