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
kubeseal -o yaml < ./static/ci-cd/cd-environment-variables.secret.yaml > ./static/ci-cd/cd-environment-variables.sealedsecret.yaml
kubeseal -o yaml < ./static/ci-cd/cd-ssh-keys.secret.yaml > ./static/ci-cd/cd-ssh-keys.sealedsecret.yaml
kubeseal -o yaml < ./static/ci-cd/ci-environment-variables.secret.yaml > ./static/ci-cd/ci-environment-variables.sealedsecret.yaml
kubeseal -o yaml < ./static/docker-registry/docker-registry-image-pull-secret.secret.yaml > ./static/docker-registry/docker-registry-image-pull-secret.sealedsecret.yaml
kubeseal -o yaml < ./static/docker-registry/docker-registry.secret.yaml > ./static/docker-registry/docker-registry.sealedsecret.yaml
kubeseal -o yaml < ./static/kafka/kafdrop.secret.yaml > ./static/kafka/kafdrop.sealedsecret.yaml
kubeseal -o yaml < ./static/kafka/kafka.secret.yaml > ./static/kafka/kafka.sealedsecret.yaml
kubeseal -o yaml < ./static/kafka/zookeeper.secret.yaml > ./static/kafka/zookeeper.sealedsecret.yaml
kubeseal -o yaml < ./static/minio/minio.secret.yaml > ./static/minio/minio.sealedsecret.yaml
kubeseal -o yaml < ./static/mongodb/mongodb.secret.yaml > ./static/mongodb/mongodb.sealedsecret.yaml
kubeseal -o yaml < ./static/mongodb/mongoku.secret.yaml > ./static/mongodb/mongoku.sealedsecret.yaml
kubeseal -o yaml < ./static/ingress-nginx/basic-authentication.secret.yaml > ./static/ingress-nginx/basic-authentication.sealedsecret.yaml
kubeseal -o yaml < ./static/nodejs/e2e.secret.yaml > ./static/nodejs/e2e.sealedsecret.yaml
kubeseal -o yaml < ./static/nodejs/environment-variables.secret.yaml > ./static/nodejs/environment-variables.sealedsecret.yaml
kubeseal -o yaml < ./static/rabbitmq/rabbitmq.secret.yaml > ./static/rabbitmq/rabbitmq.sealedsecret.yaml
kubeseal -o yaml < ./static/verdaccio/verdaccio.secret.yaml > ./static/verdaccio/verdaccio.sealedsecret.yaml
```
