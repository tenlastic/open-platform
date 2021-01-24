## Local Development

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

#### Deploy Resources to Local Kubernetes Cluster

```
kubectl apply -f ./helm-operator/
kubectl apply -f ./
```

#### Exec into the Workspace Pod

```
kubectl exec -it workspace -- /bin/bash
```
