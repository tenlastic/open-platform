#!/bin/bash
set -e

# Start Primary node.
mkdir /data/db1/
mongod --bind_ip_all --dbpath /data/db1/ --fork --logpath /var/log/mongodb1.log --port 27017 --replSet rs0

# Start first Secondary node.
mkdir /data/db2/
mongod --bind_ip_all --dbpath /data/db2/ --fork --logpath /var/log/mongodb2.log --port 27018 --replSet rs0

# Start second Secondary node.
mkdir /data/db3/
mongod --bind_ip_all --dbpath /data/db3/ --fork --logpath /var/log/mongodb3.log --port 27019 --replSet rs0

# Initiate the Replica Set with given hostnames.
REPLICA_SET_HOSTNAME="${REPLICA_SET_HOSTNAME:-localhost}"
mongo --eval "rs.initiate({
  _id : 'rs0',
  members: [
    { _id: 0, host: '${REPLICA_SET_HOSTNAME}:27017' },
    { _id: 1, host: '${REPLICA_SET_HOSTNAME}:27018' },
    { _id: 2, host: '${REPLICA_SET_HOSTNAME}:27019' }
  ]
})"

# Monitor mongod processes. If none are running, exit with error.
while sleep 15; do
  ps aux | grep mongod | grep -q -v grep
  MONGOD_STATUS=$?

  if [ $MONGOD_STATUS -ne 0 ]; then
    echo "No mongod processes running."
    exit 1
  fi
done
