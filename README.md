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

```bash
# Log in to GCloud CLI.
gcloud auth login
gcloud config set project [PROJECT]

# Enable required services.
gcloud services enable cloudbilling.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable deploymentmanager.googleapis.com
gcloud services enable iam.googleapis.com

# Grant the Google APIs service account with the Owner role.
./gcloud/scripts/google-apis-service-account.sh

# Deploy service account and storage bucket for Terraform.
gcloud deployment-manager deployments create "terraform-resources" \
  --template "./deployment-manager/terraform-resources.jinja"

# Create service account for Terraform.
./gcloud/scripts/get-service-account-key.sh terraform

# Deploy Kubernetes cluster.
terraform init ./gcloud/terraform/production/
terraform apply ./gcloud/terraform/production/

# Connect to cluster.
gcloud container clusters get-credentials primary \
  --zone "us-central1-a"
```


#### Setup Istio with Automatic SSL Provisioning

```bash
# Install Tiller.
./kubernetes/scripts/tiller.sh

# Install CertManager.
./kubernetes/scripts/cert-manager.sh

# Install Istio.
./kubernetes/scripts/istio.sh

# Create Wildcard Certificate.
kubectl apply -f ./kubernetes/istio/certificate.yml

# Restart Istio Ingressgateway to reload certificate.
export TIMESTAMP=$(date +%s)
kubectl patch -n istio-system deployment/istio-ingressgateway \
  -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"date\":\"${TIMESTAMP}\"}}}}}"
```


#### Setup Infrastructure

```bash
# Add extra storage classes.
kubectl apply -f ./kubernetes/objects/storage-classes/

# Install MongoDB.
./kubernetes/scripts/mongodb.sh
```


### Notes

- Enable Istio Sidecar injection for namespace.
```bash
kubectl label namespace default istio-injection=enabled \
  --overwrite
```
