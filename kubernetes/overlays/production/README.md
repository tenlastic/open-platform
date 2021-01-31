#### Deploy Resources

```bash
export PROJECT="production-303220"

# Download Service Account credentials for CertManager.
gcloud iam service-accounts keys create "../../gcp/service-accounts/dns-admin.json" \
  --iam-account "dns-admin@${PROJECT}.iam.gserviceaccount.com"

# Create resources.
kustomize build ./ | kubectl apply -f -
```

Don't worry if the `kustomize` command fails, Flux will take care of the rest.

#### Updating Secrets

Make sure to update all passwords, htpasswd files, and the `auth` field within
`docker-registry-image-pull-secret.secret.yaml`. Update all secrets with the following command:

```bash
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./argo/argo-ci.secret.yaml > ./argo/argo-ci.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./cert-manager/cert-manager-credentials.secret.yaml > ./cert-manager/cert-manager-credentials.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./ci-cd/cd-environment-variables.secret.yaml > ./ci-cd/cd-environment-variables.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./ci-cd/cd-ssh-keys.secret.yaml > ./ci-cd/cd-ssh-keys.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./ci-cd/ci-environment-variables.secret.yaml > ./ci-cd/ci-environment-variables.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./docker-registry/docker-registry-image-pull-secret.secret.yaml > ./docker-registry/docker-registry-image-pull-secret.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./docker-registry/docker-registry.secret.yaml > ./docker-registry/docker-registry.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./kafka/kafdrop.secret.yaml > ./kafka/kafdrop.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./kafka/kafka.secret.yaml > ./kafka/kafka.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./kafka/zookeeper.secret.yaml > ./kafka/zookeeper.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./minio/minio.secret.yaml > ./minio/minio.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./mongodb/mongodb.secret.yaml > ./mongodb/mongodb.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./mongodb/mongoku.secret.yaml > ./mongodb/mongoku.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./ingress-nginx/basic-authentication.secret.yaml > ./ingress-nginx/basic-authentication.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./nodejs/environment-variables.secret.yaml > ./nodejs/environment-variables.sealedsecret.yaml
kubeseal --controller-name sealed-secrets --controller-namespace default -o yaml < ./rabbitmq/rabbitmq.secret.yaml > ./rabbitmq/rabbitmq.sealedsecret.yaml
```
