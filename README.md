## Getting Started


#### Install CLI Tools

```bash
# Install Argo CLI.
./scripts/install/argo.sh

# Install Google Cloud CLI.
./scripts/install/gcloud.sh

# Install Helm.
./scripts/install/helm.sh

# Install Kustomize.
./scripts/install/kustomize.sh

# Install Velero.
./scripts/install/velero.sh

# Install Argo.
./kubernetes/scripts/argo.sh
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
export GOOGLE_CREDENTIALS=$(cat ./gcloud/service-accounts/terraform.json)

# Deploy IAM profiles.
cd ./gcloud/terraform/custom-roles/
terraform init -backend-config="./backend.example.tfvars"
terraform apply -auto-approve
cd ../../../

# Deploy Kubernetes cluster.
cd ./gcloud/terraform/cluster/
terraform init -backend-config="./backend.example.tfvars"
terraform apply -auto-approve
cd ../../../

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

# Upload Grafana dashboards.
./kubernetes/scripts/grafana-dashboards.sh

# Create Wildcard Certificate.
kubectl apply -f ./kubernetes/objects/istio/certificate.yml

# Restart Istio Ingressgateway to reload certificate.
export TIMESTAMP=$(date +%s)
kubectl patch deployment -n istio-system  istio-ingressgateway \
  -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"date\":\"${TIMESTAMP}\"}}}}}"
```


#### Setup Infrastructure

```bash
# Add extra storage classes.
kubectl apply -f ./kubernetes/objects/storage-classes/

# Install Kafka.
./kubernetes/scripts/kafka.sh

# Install MongoDB.
./kubernetes/scripts/mongodb.sh

# Install Minio.
./kubernetes/scripts/minio.sh

# Install PostgreSQL.
./kubernetes/scripts/postgresql.sh

# Install Redis.
./kubernetes/scripts/redis.sh

# Install Velero.
./kubernetes/scripts/velero.sh
```


### Notes

- Enable Istio Sidecar injection for namespace.
```bash
kubectl label namespace default istio-injection=enabled \
  --overwrite
```
