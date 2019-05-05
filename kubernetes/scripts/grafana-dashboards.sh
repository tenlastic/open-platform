#!/usr/bin/env bash
set -e

# Open a connection to Grafana locally.
kubectl port-forward -n istio-system svc/grafana 3000:3000 &

# Loop through all Grafana dashboards.
for filename in ./grafana/*.json; do
  JSON=$(cat "${filename}")

  # POST dashboard to Grafana.
  curl --header "Content-Type: application/json" \
    --request "POST" \
    --data '{"dashboard":'"${JSON}"',"overwrite":true}' \
    "http://localhost:3000/api/dashboards/db"
done

# Close the Grafana connection.
kill $!
