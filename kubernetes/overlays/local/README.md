#### Configure Hosts File

Add the following lines to your `hosts` file to properly route to your local Kubernetes cluster.

```
127.0.0.1 api.localhost
127.0.0.1 argo.localhost
127.0.0.1 docker-registry.localhost
127.0.0.1 kafka.localhost
127.0.0.1 minio.localhost
127.0.0.1 mongo.localhost
127.0.0.1 rabbitmq.localhost
127.0.0.1 registry.localhost
127.0.0.1 www.localhost
```

Default Location per Platform:

- Mac: /private/etc/hosts
- Windows: C:/windows/system32/drivers/etc/hosts

#### Deploy Resources

If you would like to run the Open Platform without modifying its source code, run the following command:

```bash
# Apply Node labels.
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/high-priority=true
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/low-priority=true

# Create resources.
kustomize build ./ | kubectl apply -f -
```
