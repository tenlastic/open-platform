#!/usr/bin/env bash
set -e

SERVICE_NAME="${1}"

echo "Forwarding service: ${SERVICE_NAME}"

if [ "${SERVICE_NAME}" == "grafana" ]; then
  kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=grafana -o jsonpath='{.items[0].metadata.name}') 8080:3000
elif [ "${SERVICE_NAME}" == "jaeger" ]; then
  kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=jaeger -o jsonpath='{.items[0].metadata.name}') 8081:16686
elif [ "${SERVICE_NAME}" == "kiali" ]; then
  kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=kiali -o jsonpath='{.items[0].metadata.name}') 8082:20001
elif [ "${SERVICE_NAME}" == "mongodb" ]; then
  kubectl -n mongodb port-forward mongodb-mongodb-replicaset-1 27017:27017
elif [ "${SERVICE_NAME}" == "prometheus" ]; then
  kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=prometheus -o jsonpath='{.items[0].metadata.name}') 8083:9090
elif [ "${SERVICE_NAME}" == "redis" ]; then
  kubectl -n redis port-forward redis-redis-ha-server-0 6379:6379
fi
