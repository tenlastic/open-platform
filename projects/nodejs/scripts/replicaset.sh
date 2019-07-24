#!/bin/bash
set -e

until mongo --host mongo_primary --eval 'print("Connection successful.")'; do
  sleep 5
done

until mongo --host mongo_secondary_1 --eval 'print("Connection successful.")'; do
  sleep 5
done

until mongo --host mongo_secondary_2 --eval 'print("Connection successful.")'; do
  sleep 5
done

mongo --host mongo_primary --eval 'rs.initiate( {
  _id : "rs0",
  members: [
    { _id: 0, host: "mongo_primary:27017" },
    { _id: 1, host: "mongo_secondary_1:27017" },
    { _id: 2, host: "mongo_secondary_2:27017" }
  ]
})'
