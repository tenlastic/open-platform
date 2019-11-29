## Getting Started

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

#### Setup Infrastructure

```bash
# Add extra storage classes.
kubectl apply -f ./modules/storage-classes/

# Install Tiller.
./modules/tiller/install.sh

# Install Argo.
./modules/argo/install.sh

# Install Grafana.
./modules/grafana/install.sh

# Install Istio.
./modules/istio/install.sh

# Install Kafka.
./modules/kafka/install.sh

# Install MongoDB.
./modules/mongodb/install.sh

# Install MinIO.
./modules/minio/install.sh

# Install PostgreSQL.
./modules/postgresql/install.sh

# Install Redis.
./modules/redis/install.sh

# Install Velero.
./modules/velero/install.sh
```

### Notes

- Enable Istio Sidecar injection for namespace.

```bash
kubectl label namespace default istio-injection=enabled \
  --overwrite
```
