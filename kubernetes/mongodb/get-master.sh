#!/usr/bin/env bash
set -e

# Get a list of all MongoDB pods.
MONGODB_PODS=($(
  kubectl get pods -n mongodb --no-headers -o custom-columns=":metadata.name"
))

# Iterate through pods to find the master.
for i in "${MONGODB_PODS[@]}"; do
  IS_MASTER=$(
    kubectl exec $i \
      --container mongodb-replicaset \
      --namespace mongodb \
      -- sh -c 'mongo --quiet --eval="printjson(rs.isMaster().ismaster)"'
  )

  if [ "${IS_MASTER}" == "true" ]; then
    echo $i
    break
  fi
done
