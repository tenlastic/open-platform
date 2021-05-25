#### Configure Hosts File

Add the following lines to your `hosts` file to properly route to your local Kubernetes cluster.

```
127.0.0.1 api.localhost
127.0.0.1 argo.localhost
127.0.0.1 docker-registry.localhost
127.0.0.1 kafka.localhost
127.0.0.1 minio.localhost
127.0.0.1 mongo.localhost
127.0.0.1 registry.localhost
127.0.0.1 www.localhost
```

Default Location per Platform:

- Mac: /private/etc/hosts
- Windows: C:/windows/system32/drivers/etc/hosts

#### Deploy Resources

If you would like to modify the Open Platform's Javascript source code, run the following command:

```bash
# Apply Node labels.
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/high-priority=true
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/low-priority=true

# Initialize Workspace resources.
kubectl apply -f ../../base/cluster/namespaces/dynamic.yaml
kubectl apply -f ../../base/cluster/namespaces/static.yaml
kubectl apply -f ./dynamic/workspace/
kubectl apply -f ./static/workspace/

# Wait for Workspace Pods to be created.
kubectl wait -n dynamic --for=condition=Ready pod/workspace
kubectl wait -n static --for=condition=Ready pod/workspace

# Install Node Modules.
kubectl exec -it -c workspace -n dynamic workspace -- /bin/bash -c 'cd ./projects/javascript/ && lerna bootstrap'
kubectl exec -it -c workspace -n static workspace -- /bin/bash -c 'cd ./projects/javascript/ && lerna bootstrap'

# Create remaining resources.
kustomize build ./ | kubectl apply -f -
```

#### SSH into Workspace Pod

To make Javascript development easier, you can SSH into the Workspace Pod with the following command:

```bash
kubectl exec -it -n dynamic workspace -- /bin/bash
kubectl exec -it -n static workspace -- /bin/bash
```
