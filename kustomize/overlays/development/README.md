## Install MicroK8s on WSL2 and Ubuntu 22.04

```powershell
# Update WSL to the latest version and ensure WSL2 is set as the default version.
wsl --update
wsl --set-default-version 2

# Enable systemd by running the following command in the WSL terminal.
wsl sudo bash -c 'cat > /etc/wsl.conf << EOL
[boot]
systemd=true
EOL'

# Restart WSL.
wsl --shutdown
wsl

# From this point, `systemd`` is enabled and snaps should work properly.
wsl sudo snap list
```

## Set Up MicroK8s

```bash
# Install MicroK8s with Snap.
sudo snap install microk8s --classic

# Wait for MicroK8s to start.
sudo microk8s status --wait-ready

# Get the IP address of MicroK8s.
IP_ADDRESS=$(sudo microk8s kubectl get node -o json | jq -r '.items[].status.addresses[] | select(.type=="InternalIP") | .address')

# Enable addons.
sudo microk8s enable dns
sudo microk8s enable helm
sudo microk8s enable helm3
sudo microk8s enable hostpath-storage
sudo microk8s enable metallb:${IP_ADDRESS}-${IP_ADDRESS}
sudo microk8s enable metrics-server
sudo microk8s enable rbac

# Enable insecure Docker Registry.
sudo mkdir -p /var/snap/microk8s/current/args/certs.d/docker-registry.local.tenlastic.com
sudo bash -c 'cat > /var/snap/microk8s/current/args/certs.d/docker-registry.local.tenlastic.com/hosts.toml << EOL
# /var/snap/microk8s/current/args/certs.d/docker-registry.local.tenlastic.com/hosts.toml
server = "http://docker-registry.local.tenlastic.com"

[host."http://docker-registry.local.tenlastic.com"]
capabilities = ["pull", "resolve"]
EOL'
```

## Configure Hosts File

Default location per platform:

- Linux: /etc/hosts
- Windows: C:\Windows\System32\drivers\etc\hosts

Add the following lines to the file, replacing `127.0.0.1` with `IP_ADDRESS` from above.

```bash
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

To automatically update `/etc/hosts` on Linux:

```bash
./scripts/hosts.sh /etc/hosts $IP_ADDRESS
```

## Deploy Resources

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

# Initialize Workspace resources.
./scripts/workspace.sh

# Create remaining resources.
./scripts/kustomize.sh
```

## SSH into Workspace Pod

To make Javascript development easier, you can SSH into the Workspace Pod with the following command:

```bash
kubectl exec -it -c workspace -n static workspace -- /bin/bash
```
