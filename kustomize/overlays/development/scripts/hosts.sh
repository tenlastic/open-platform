#!/bin/bash

FILE="${1}"
IP_ADDRESS="${2}"

upsert () {
  HOSTNAME="${1}"
  GREP=$(grep -P "\t${HOSTNAME}" "${FILE}")

  if [ -n "${GREP}" ]; then
    sudo sed -i "s/${GREP}/${IP_ADDRESS}\t${HOSTNAME}/g" $FILE
    echo "Updated ${HOSTNAME} to ${IP_ADDRESS}."
  else
    echo -e "${IP_ADDRESS}\t${HOSTNAME}" | sudo tee -a "${FILE}" > /dev/null
    echo "Added ${HOSTNAME} as ${IP_ADDRESS}."
  fi
}

upsert api.local.tenlastic.com
upsert argo.local.tenlastic.com
upsert docker-registry.local.tenlastic.com
upsert minio.local.tenlastic.com
upsert minio-console.local.tenlastic.com
upsert mongo.local.tenlastic.com
upsert registry.local.tenlastic.com
upsert verdaccio.local.tenlastic.com
upsert wss.local.tenlastic.com
upsert www.local.tenlastic.com
