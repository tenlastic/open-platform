#/usr/bin/env bash
set -e

# Set up Istio sidecars.
kubectl create namespace kafka
kubectl label namespace kafka istio-injection=enabled \
  --overwrite

# Install Kafka Helm chart.
helm repo add incubator http://storage.googleapis.com/kubernetes-charts-incubator
helm upgrade kafka incubator/kafka \
  --install \
  --namespace "kafka" \
  --values "./helm/values/kafka.yml"

# Install Kafka Dashboards.
kubectl apply -f ./kubernetes/objects/kafka/
