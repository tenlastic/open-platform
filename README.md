## Getting Started


#### Install CLI Tools

```bash
# Install Argo CLI.
./scripts/install/argo.sh

# Install Google Cloud CLI.
./scripts/install/gcloud.sh

# Install Helm CLI.
./scripts/install/helm.sh

# Install Kustomize CLI.
./scripts/install/kustomize.sh

# Install Velero CLI.
./scripts/install/velero.sh
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


#### Setup Infrastructure

```bash
# Add extra storage classes.
kubectl apply -f ./kubernetes/storage-classes/

# Install Tiller.
./kubernetes/tiller/install.sh

# Install Argo.
# ./kubernetes/argo/install.sh

# Install Grafana.
./kubernetes/grafana/install.sh

# Install Istio.
./kubernetes/istio/install.sh

# Install Kafka.
# ./kubernetes/kafka/install.sh

# Install MongoDB.
./kubernetes/mongodb/install.sh

# Install MinIO.
./kubernetes/minio/install.sh

# Install PostgreSQL.
./kubernetes/postgresql/install.sh

# Install Redis.
./kubernetes/redis/install.sh

# Install Velero.
./kubernetes/velero/install.sh
```


### Notes

- Enable Istio Sidecar injection for namespace.
```bash
kubectl label namespace default istio-injection=enabled \
  --overwrite
```
