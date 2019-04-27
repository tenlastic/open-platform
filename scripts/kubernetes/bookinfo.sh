#!/usr/bin/env bash

# Deploy the BookInfo project.
kubectl apply -f ./kubernetes/bookinfo/

# Get the endpoint for BookInfo.
# INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
# INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')
# GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT

# Echo the endpoint.
# echo "http://${GATEWAY_URL}/productpage"
