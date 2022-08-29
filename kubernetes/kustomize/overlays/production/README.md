#### Deploy Resources

```bash
export PROJECT="production-303220"

# Set default namespace to "static".
kubectl config set-context --current --namespace=static

# Download Service Account credentials for CertManager.
gcloud iam service-accounts keys create "../../../gcp/service-accounts/dns-admin.json" \
  --iam-account "dns-admin@${PROJECT}.iam.gserviceaccount.com"

# Install Helm Operator.
kubectl apply -f ../../base/cluster/namespaces/
kubectl apply -f ../../base/static/helm-operator/

# Install Sealed Secrets.
kubectl apply -f ../../base/static/sealed-secrets/

# Install Flux.
kubectl apply -f ./static/flux/
```

Don't worry if the `kustomize` command fails, Flux will take care of the rest.

#### Updating Secrets

Make sure to update all passwords and htpasswd files. Update all secrets with the following command:

```bash
export SEALED_SECRETS_CONTROLLER_NAME="sealed-secrets"
export SEALED_SECRETS_CONTROLLER_NAMESPACE="static"

kubeseal -o yaml < ./default/argo/argo-ci.secret.yaml > ./default/argo/argo-ci.sealedsecret.yaml
kubeseal -o yaml < ./dynamic/secrets/docker-registry.secret.yaml > ./dynamic/secrets/docker-registry.sealedsecret.yaml
kubeseal -o yaml < ./static/cert-manager/cert-manager-credentials.secret.yaml > ./static/cert-manager/cert-manager-credentials.sealedsecret.yaml
kubeseal -o yaml < ./static/continuous-deployment/continuous-deployment.secret.yaml > ./static/continuous-deployment/continuous-deployment.sealedsecret.yaml
kubeseal -o yaml < ./static/continuous-integration/continuous-integration.secret.yaml > ./static/continuous-integration/continuous-integration.sealedsecret.yaml
kubeseal -o yaml < ./static/docker-registry/docker-registry-image-pull-secret.secret.yaml > ./static/docker-registry/docker-registry-image-pull-secret.sealedsecret.yaml
kubeseal -o yaml < ./static/docker-registry/docker-registry.secret.yaml > ./static/docker-registry/docker-registry.sealedsecret.yaml
kubeseal -o yaml < ./static/grafana/grafana.secret.yaml > ./static/grafana/grafana.sealedsecret.yaml
kubeseal -o yaml < ./static/ingress-nginx/basic-authentication.secret.yaml > ./static/ingress-nginx/basic-authentication.sealedsecret.yaml
kubeseal -o yaml < ./static/minio/minio.secret.yaml > ./static/minio/minio.sealedsecret.yaml
kubeseal -o yaml < ./static/mongodb/mongodb.secret.yaml > ./static/mongodb/mongodb.sealedsecret.yaml
kubeseal -o yaml < ./static/mongodb/mongodb-gui.secret.yaml > ./static/mongodb/mongodb-gui.sealedsecret.yaml
kubeseal -o yaml < ./static/nats/nats.secret.yaml > ./static/nats/nats.sealedsecret.yaml
kubeseal -o yaml < ./static/nodejs/e2e.secret.yaml > ./static/nodejs/e2e.sealedsecret.yaml
kubeseal -o yaml < ./static/nodejs/nodejs.secret.yaml > ./static/nodejs/nodejs.sealedsecret.yaml
kubeseal -o yaml < ./static/redis/redis.secret.yaml > ./static/redis/redis.sealedsecret.yaml
kubeseal -o yaml < ./static/verdaccio/verdaccio.secret.yaml > ./static/verdaccio/verdaccio.sealedsecret.yaml
```
