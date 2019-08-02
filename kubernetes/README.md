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
kubectl apply -f ./storage-classes/

# Install Tiller.
./tiller/install.sh

# Install Argo.
# ./argo/install.sh

# Install Grafana.
./grafana/install.sh

# Install Istio.
./istio/install.sh

# Install Kafka.
# ./kafka/install.sh

# Install MongoDB.
./mongodb/install.sh

# Install MinIO.
./minio/install.sh

# Install PostgreSQL.
./postgresql/install.sh

# Install Redis.
./redis/install.sh

# Install Velero.
./velero/install.sh
```

### Notes

- Enable Istio Sidecar injection for namespace.

```bash
kubectl label namespace default istio-injection=enabled \
  --overwrite
```
