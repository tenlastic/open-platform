#!/usr/bin/env bash
set -e

# Initialize istio-system namespace.
kubectl apply -f ./kubernetes/objects/istio/namespace.yml

# Initialize Grafana secret for login.
kubectl apply -f ./kubernetes/objects/grafana/secret.yml

# Initialize Kiali secret for login.
kubectl apply -f ./kubernetes/objects/kiali/secret.yml

# Initialize Istio.
helm upgrade istio-init ./kubernetes/charts/istio-init-1.1.0.tgz \
  --install \
  --namespace "istio-system"

# Wait for install to finish.
echo "Waiting for install to finish..."
sleep 30

# Get static IP address from Terraform.
cd ./gcloud/terraform/production/
ISTIO_IP_ADDRESS=$(terraform output istio_ip_address)
cd ../../../

# Install Istio.
helm upgrade istio ./kubernetes/charts/istio-1.1.0.tgz \
  --install \
  --namespace "istio-system" \
  --set gateways.istio-ingressgateway.loadBalancerIP="${ISTIO_IP_ADDRESS}" \
  --values "./helm/values/istio.yml"

# Redirect from HTTP to HTTPS.
kubectl -n istio-system patch gateway istio-autogenerated-k8s-ingress \
  --type "json" \
  -p '[{"op": "replace", "path": "/spec/servers/0/tls", "value": {"httpsRedirect": true}}]'

# Load SSL certificate for HTTPS requests.
kubectl -n istio-system patch gateway istio-autogenerated-k8s-ingress \
  --type "json" \
  -p '[{"op": "replace", "path": "/spec/servers/1/tls", "value": {"mode": "SIMPLE","privateKey":"/etc/istio/ingressgateway-certs/tls.key","serverCertificate":"/etc/istio/ingressgateway-certs/tls.crt"}}]'

# Expose Grafana Dashboards.
kubectl apply -f ./kubernetes/objects/grafana/virtual-service.yml

# Expose Kiali Dashboards.
kubectl apply -f ./kubernetes/objects/kiali/virtual-service.yml
