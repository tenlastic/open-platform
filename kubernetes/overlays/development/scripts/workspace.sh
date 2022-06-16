#!/bin/bash
set -e

# Initialize Workspace resources.
kubectl apply -f ../../base/cluster/namespaces/dynamic.yaml
kubectl apply -f ../../base/cluster/namespaces/static.yaml
kubectl apply -f ./dynamic/workspace/
kubectl apply -f ./static/workspace/

# Wait for Workspace Pods to be created.
kubectl wait -n dynamic --for=condition=Ready pod/workspace
kubectl wait -n static --for=condition=Ready pod/workspace