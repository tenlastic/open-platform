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
