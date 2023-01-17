#### Configure Hosts File

Add the following lines to your `hosts` file to properly route to your local Kubernetes cluster.

```
127.0.0.1 api.local.tenlastic.com
127.0.0.1 argo.local.tenlastic.com
127.0.0.1 docker-registry.local.tenlastic.com
127.0.0.1 minio.local.tenlastic.com
127.0.0.1 minio-console.local.tenlastic.com
127.0.0.1 mongo.local.tenlastic.com
127.0.0.1 registry.local.tenlastic.com
127.0.0.1 verdaccio.local.tenlastic.com
127.0.0.1 wss.local.tenlastic.com
127.0.0.1 www.local.tenlastic.com
```

Default Location per Platform:

- Mac: /private/etc/hosts
- Windows: C:/windows/system32/drivers/etc/hosts

#### Deploy Resources

If you would like to run the Open Platform without modifying its source code, run the following command:

```bash
# Set default namespace to "static".
kubectl config set-context --current --namespace=static

# Apply Node labels.
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/high-priority=true
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/low-priority=true

# Install Flux and the Helm Controller.
kubectl apply -f ../../base/cluster/namespaces/
helm install \
  -f ../../../helm/values/base/flux.yaml \
  -n static \
  flux \
  ../../../helm/charts/flux/

# Create resources.
kustomize build ./ | kubectl apply -f -

# Apply local, uncommitted secret files. (Kubectl PR: https://github.com/kubernetes/kubernetes/pull/102265)
kubectl apply $(find ./ -name '*.secret.yaml' -type f | awk ' { print " -f " $1 } ')
```
