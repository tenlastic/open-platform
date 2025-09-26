#### Deploy Resources

```bash
export PROJECT="production-303220"

# Set default namespace to "static".
kubectl config set-context --current --namespace=static

# Download Service Account credentials for CertManager.
gcloud iam service-accounts keys create "../../../gcp/service-accounts/dns-admin.json" \
  --iam-account "dns-admin@${PROJECT}.iam.gserviceaccount.com"

# Update NGINX load balancer IP address.
cd ../../../gcp/terraform/
export GOOGLE_CREDENTIALS=$(cat ../service-accounts/terraform.json)
export LOAD_BALANCER_IP=$(terraform output -raw load_balancer_ip_address)
cd ../../kustomize/overlays/production/
sed -E -i "s/[0-9.]{7,15}/${LOAD_BALANCER_IP}/g" ./static/ingress-nginx/ingress-nginx.yaml

# Install Flux and the Helm Controller.
kubectl apply -f ../../base/cluster/namespaces/
helm install \
  -f ../../../helm/values/base/flux.yaml \
  -n static \
  flux \
  ../../../helm/charts/flux/

# Apply the Open Platform repository and kustomization.
kubectl apply -f ../../base/static/flux/open-platform.gitrepository.yaml
kubectl apply -f ./static/flux/open-platform.kustomization.yaml

# Apply initial kustomization.
kustomize build ./ | kubectl apply -f -
```

Don't worry if the `kustomize` command fails, Flux will take care of the rest.
