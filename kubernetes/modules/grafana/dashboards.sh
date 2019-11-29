#!/usr/bin/env bash
set -e

DIRNAME=$(dirname $0)

# Open a connection to Grafana locally.
kubectl port-forward -n grafana svc/grafana 3000:3000 &

# Wait for port forward to activate.
echo "Waiting for port forward to activate..."
sleep 5

# Loop through all Grafana dashboards.
for filename in "${DIRNAME}"/dashboards/*.json; do
  JSON=$(cat "${filename}")

  # POST dashboard to Grafana.
  curl --header "Content-Type: application/json" \
    --request "POST" \
    --data '{"dashboard":'"${JSON}"',"overwrite":true}' \
    "http://admin:admin@localhost:3000/api/dashboards/db"
done

# Close the Grafana connection.
kill $!
