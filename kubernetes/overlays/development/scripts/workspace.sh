#!/bin/bash
set -e

# Initialize Workspace resources.
kubectl apply -f ../../base/cluster/namespaces/static.yaml
kubectl apply -f ./static/workspace/

# Wait for Workspace Pods to be created.
kubectl wait -n static --for=condition=Ready --timeout 120s pod/workspace

# Bootstrap Node modules.
kubectl exec -it -c workspace workspace -- /bin/bash -c 'cd ./angular/ && lerna bootstrap && lerna run build'
kubectl exec -it -c workspace workspace -- /bin/bash -c 'cd ./nodejs/ && lerna bootstrap && lerna run build'