## Local Development

#### Enable Kubernetes within Docker for Desktop

#### Install Nginx Ingress Controller

Follow the directions for "Docker for Mac" on the [Nginx website](https://kubernetes.github.io/ingress-nginx/deploy).

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.30.0/deploy/static/mandatory.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.30.0/deploy/static/provider/cloud-generic.yaml
```

#### Configure Hosts File

Add the following lines to your hosts file to properly route to your local Kubernetes cluster.

```
127.0.0.1 api.localhost
127.0.0.1 argo.localhost
127.0.0.1 docker-registry.localhost
127.0.0.1 kafka.localhost
127.0.0.1 minio.localhost
127.0.0.1 mongo.localhost
127.0.0.1 platform.localhost
127.0.0.1 portal.localhost
127.0.0.1 rabbitmq.localhost
127.0.0.1 registry.localhost
127.0.0.1 sso.localhost
127.0.0.1 www.localhost
```

#### Install Sealed Secrets

Install Sealed Secrets on your local Kubernetes cluster:

```
kubectl apply -f ./local/sealed-secrets/sealed-secrets.yml
```

Obtain a copy of the master key for Sealed Secrets and upload it to your cluster:

```
kubectl apply -f sealed-secrets.secret.yml
kubectl delete pod -n kube-system -l name=sealed-secrets-controller
```

## Production

#### Install CLI Tools

```bash
# Install Argo CLI.
./scripts/install/argo.sh

# Install Helm CLI.
./scripts/install/helm.sh

# Install Kustomize CLI.
./scripts/install/kustomize.sh

# Install Velero CLI.
./scripts/install/velero.sh
```

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
