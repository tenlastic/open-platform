### Getting Started

- Install Google Cloud CLI: `./scripts/install/gcloud.sh`.
- Install Helm: `./scripts/install/helm.sh`.
- Install Istio: `./scripts/kubernetes/istio.sh`.
- Install Kustomize: `./scripts/install/kustomize.sh`.

- Launch the Kubernetes Cluster: `./scripts/infrastructure/cluster.sh`.
- Add preemptible VM pool to cluster: `./scripts/infrastructure/preemptible-node-pool.sh`.

- Create a Cloud DNS Admin IAM Profile: `kubectl apply -f ./scripts/infrastructure/cloud-dns-admin.sh`.

- Install Tiller: `./scripts/kubernetes/tiller.sh`.
- Install CertManager: `./scripts/kubernetes/cert-manager.sh`.
- Create Wildcard Certificate: `kubectl apply -f ./kubernetes/istio/certificate.yml`.
- Install Istio: `./scripts/kubernetes/istio.sh`.

- Launch the DNS Managed Zone: `./scripts/infrastructure/managed-zone.sh`.

- Install Book Info: `./scripts/kubernetes/bookinfo.sh`.


### Notes

- Restart Ingress to reload certificate:
```bash
TIMESTAMP=$(date +%s)
kubectl patch -n istio-system deployment/istio-ingressgateway \
  -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"date\":\"${TIMESTAMP}\"}}}}}"
```
