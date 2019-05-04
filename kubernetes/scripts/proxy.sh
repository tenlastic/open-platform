#!/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)
SERVICE_NAME="${1}"

echo "Forwarding service: ${SERVICE_NAME}"

# Grafana
if [ "${SERVICE_NAME}" == "grafana" ]; then
  kubectl port-forward -n istio-system $(kubectl -n istio-system get pod -l app=grafana -o jsonpath='{.items[0].metadata.name}') 8080:3000

# Jaeger
elif [ "${SERVICE_NAME}" == "jaeger" ]; then
  kubectl port-forward -n istio-system $(kubectl -n istio-system get pod -l app=jaeger -o jsonpath='{.items[0].metadata.name}') 8081:16686

# Kafka
elif [ "${SERVICE_NAME}" == "kafka" ]; then
  kubectl -n kafka port-forward svc/kafka 9092:9092

# Kafka Manager
elif [ "${SERVICE_NAME}" == "kafka-manager" ]; then
  kubectl -n kafka port-forward svc/kafka-manager 9000:9000

# Kiali
elif [ "${SERVICE_NAME}" == "kiali" ]; then
  kubectl port-forward -n istio-system $(kubectl -n istio-system get pod -l app=kiali -o jsonpath='{.items[0].metadata.name}') 8082:20001

# MongoDB
elif [ "${SERVICE_NAME}" == "mongodb" ]; then
  MASTER=$($DIRNAME/mongodb-primary.sh)
  kubectl port-forward -n mongodb "${MASTER}" 27017:27017

# Prometheus
elif [ "${SERVICE_NAME}" == "prometheus" ]; then
  kubectl port-forward -n istio-system $(kubectl -n istio-system get pod -l app=prometheus -o jsonpath='{.items[0].metadata.name}') 8083:9090

# Redis
elif [ "${SERVICE_NAME}" == "redis" ]; then
  kubectl port-forward -n redis svc/redis-redis-ha 6379:6379

# Zookeeper
elif [ "${SERVICE_NAME}" == "zookeeper" ]; then
  kubectl port-forward -n kafka svc/kafka-zookeeper 2181:2181
fi
