#/usr/bin/env bash
set -e

# Create the Kafka namespace.
kubectl apply -f ./kubernetes/objects/kafka/namespace.yml

# Install Kafka Helm chart.
helm repo add incubator http://storage.googleapis.com/kubernetes-charts-incubator
helm upgrade kafka incubator/kafka \
  --install \
  --namespace "kafka" \
  --values "./helm/values/kafka.yml"

# Install Kafka Dashboards.
kubectl apply -f ./kubernetes/objects/kafka/
