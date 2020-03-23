#!/bin/bash
set -a

# Docker
DOCKER_ENGINE_URL="http://dind:2375"
DOCKER_REGISTRY_URL="http://registry:5000"

# Emails
PASSWORD_RESET_URL="http://localhost:4201/password-reset"

# End-to-End Testing
E2E_GMAIL_CLIENT_ID="012345678901-abcd12a1abcdef123abcde12abcd1a1a.apps.googleusercontent.com"
E2E_GMAIL_CLIENT_SECRET="abc12ab1a1ab_abc12a1ab1a"
E2E_GMAIL_REDIRECT_URI="abc:abcd:ab:oauth:2.0:abc"
E2E_GMAIL_REFRESH_TOKEN="1/abcd1ab12a1abcde12ab-abcde1a12abcde1abc12ab"
E2E_HOST_AUTHENTICATION_API="http://localhost:3000"
E2E_HOST_DATABASE_API="http://localhost:3002"
E2E_HOST_NAMESPACE_API="http://localhost:3001"
E2E_USER_EMAIL="test@example.com"
E2E_USER_PASSWORD="password"

# Github
GITHUB_TOKEN="1a123456ab1234567a1234ab12ab12a1234a123a"
GITHUB_USER_EMAIL="test@example.com"

# JWT
JWT_SECRET="secret"

# Kafka
KAFKA_CONNECTION_STRING="kafka:9092"
KAFKA_REPLICATION_FACTOR="1"

# Mailgun
MAILGUN_DOMAIN="support.example.com"
MAILGUN_KEY="a1234a123abc12ab12a1abc123456a12-1ab1a1a1-abc1234a"

# Minio
MINIO_CONNECTION_STRING="http://minioadmin:minioadmin@minio:9000"

# Mongo
MONGO_CONNECTION_STRING="mongodb://mongo:27017,mongo:27018,mongo:27019/admin?replicaSet=rs0"
MONGO_DATABASE_NAME="example"

# NPM
NPM_TOKEN="1a1234a1-1abc-12a1-a123-a123abc1a1a1"

# RabbitMQ
RABBITMQ_CONNECTION_STRING="amqp://rabbitmq:5672"
