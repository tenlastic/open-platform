## Getting Started


#### Install CLI Tools

```bash
# Install Google Cloud CLI.
./scripts/install/gcloud.sh

# Install Helm.
./scripts/install/helm.sh

# Install Kustomize.
./scripts/install/kustomize.sh
```


#### Deploy Infrastructure

- Log in to GCloud CLI:
  - ```bash
    gcloud auth login
    gcloud config set project [PROJECT]
    ```

- Enable required services:
  - ```bash
    gcloud services enable cloudbilling.googleapis.com
    gcloud services enable cloudresourcemanager.googleapis.com
    gcloud services enable compute.googleapis.com
    gcloud services enable container.googleapis.com
    gcloud services enable deploymentmanager.googleapis.com
    gcloud services enable iam.googleapis.com
    ```

- Grant the Google APIs service account with the Owner role:
  - ```bash
    ./gcloud/scripts/google-apis-service-account.sh
    ```

- Deploy service account and storage bucket for Terraform:
  - ```bash
    gcloud deployment-manager deployments create "terraform-resources" \
      --template "./deployment-manager/terraform-resources.jinja"
    ```

- Create service account for Terraform:
  - ```bash
    ./gcloud/scripts/get-service-account-key.sh terraform
    ```

- Deploy Kubernetes cluster:
  - ```bash
    terraform init ./gcloud/terraform/production/
    terraform apply ./gcloud/terraform/production/
    ```


- Install Tiller: `./scripts/kubernetes/tiller.sh`.
- Install CertManager: `./scripts/kubernetes/cert-manager.sh`.
- Install Istio: `./scripts/kubernetes/istio.sh`.
- Create Wildcard Certificate: `kubectl apply -f ./kubernetes/istio/certificate.yml`.
- Launch the DNS Managed Zone: `./scripts/infrastructure/managed-zone.sh`.
- Install Book Info: `./scripts/kubernetes/bookinfo.sh`.
- Install MongoDB: `./scripts/kubernetes/mongodb.sh`.


### Notes

- Restart Ingress to reload certificate:
```bash
TIMESTAMP=$(date +%s)
kubectl patch -n istio-system deployment/istio-ingressgateway \
  -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"date\":\"${TIMESTAMP}\"}}}}}"
```
