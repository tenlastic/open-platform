# MongoDB Replica Set

Runs a MongoDB Replica Set with a primary node and two secondary nodes within a single container.

### Healthcheck Included

Healthcheck makes sure the Replica Set is properly initiated. Useful within Docker Compose to
prevent containers that depend on this image from starting too early.

### Environment Variables

- `REPLICA_SET_HOSTNAME`: The network name for your Replica Set. (default: localhost)
