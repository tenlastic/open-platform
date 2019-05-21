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

# Wait for services to be created.
echo "Waiting for pods to become active..."
sleep 15

# Open a connection to Kafka Manager locally.
kubectl port-forward -n kafka svc/kafka-manager 9000:9000 &

# Wait for port forward to activate.
echo "Waiting for port forward to activate..."
sleep 15

curl 'http://localhost:9000/clusters' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3' \
  -H 'accept-encoding: gzip, deflate, br' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'cache-control: max-age=0' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' \
  --compressed \
  --data 'name=Primary&zkHosts=kafka-zookeeper.kafka.svc.cluster.local%3A2181&kafkaVersion=2.2.0&jmxEnabled=true&jmxUser=&jmxPass=&pollConsumers=true&tuning.brokerViewUpdatePeriodSeconds=30&tuning.clusterManagerThreadPoolSize=2&tuning.clusterManagerThreadPoolQueueSize=100&tuning.kafkaCommandThreadPoolSize=2&tuning.kafkaCommandThreadPoolQueueSize=100&tuning.logkafkaCommandThreadPoolSize=2&tuning.logkafkaCommandThreadPoolQueueSize=100&tuning.logkafkaUpdatePeriodSeconds=30&tuning.partitionOffsetCacheTimeoutSecs=5&tuning.brokerViewThreadPoolSize=3&tuning.brokerViewThreadPoolQueueSize=1000&tuning.offsetCacheThreadPoolSize=3&tuning.offsetCacheThreadPoolQueueSize=1000&tuning.kafkaAdminClientThreadPoolSize=3&tuning.kafkaAdminClientThreadPoolQueueSize=1000&tuning.kafkaManagedOffsetMetadataCheckMillis=30000&tuning.kafkaManagedOffsetGroupCacheSize=1000000&tuning.kafkaManagedOffsetGroupExpireDays=7&securityProtocol=PLAINTEXT&saslMechanism=DEFAULT&jaasConfig=' \
  --insecure

# Close the Kafka Manager connection.
kill $!
