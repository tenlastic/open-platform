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

#### Deploy Resources for Local Development

If you would like to run the Open Platform without modifying its source code, run the following command:

```bash
# Apply Node labels.
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/high-priority=true
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/low-priority=true

# Initialize Helm Operator.
kubectl apply -f ./helm-operator/

# Create resources.
kubectl apply $(
  find . \
    -name *.yml \
    -not -path './angular/development/*' \
    -not -path './helm-operator/*' \
    -not -path './nodejs/development/*' | \
      awk ' { print " -f " $1 } '
  )
```

## Modifying Source Code

If you would like to modify the Open Platform's source code, run the following command:

```bash
# Apply Node labels.
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/high-priority=true
kubectl label node $(kubectl get nodes -o jsonpath={..metadata.name}) tenlastic.com/low-priority=true

# Initialize Helm Operator.
kubectl apply -f ./helm-operator/

# Create Workspace Pod.
kubectl apply $(
  find . \
    -name *.yml \
    -not -path './angular/production/*' \
    -not -path './helm-operator/*' \
    -not -path './nodejs/production/*' | \
      awk ' { print " -f " $1 } '
  )

# Wait for Workspace Pod to be created.
kubectl wait --for=condition=Ready pod/workspace

# Install Node Modules.
kubectl exec -it workspace -- /bin/bash -c 'cd ./projects/javascript/ && lerna bootstrap --hoist --strict'

# Create remaining resources.
kubectl apply $(
  find . \
    -name *.yml \
    -not -path './angular/*' \
    -not -path './helm-operator/*' \
    -not -path './nodejs/*' | \
      awk ' { print " -f " $1 } '
  )
```

You can then SSH into the Workspace Pod with the following command:

```bash
kubectl exec -it workspace -- /bin/bash
```
