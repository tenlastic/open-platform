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

#### Deploy Resources to Local Kubernetes Cluster

Install the Helm Operator followed by the rest of the resources:

```
kubectl apply -f ./local/helm-operator/
kubectl apply -f ./local/
```

#### Exec into the Workspace Pod

```
kubectl exec -it workspace -- /bin/bash
```

## Production

#### Setup Production Infrastructure

```bash
# Install Tiller.
./modules/tiller/install.sh

# Install CertManager.
./modules/cert-manager/install.sh

# Install Sealed Secrets
./modules/sealed-secrets/install.sh

# Install Flux.
./modules/flux/install.sh

# Install Grafana.
./modules/grafana/install.sh

# Install Velero.
./modules/velero/install.sh
```
