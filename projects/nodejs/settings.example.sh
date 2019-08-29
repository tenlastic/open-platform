#!/bin/bash
set -a

# Emails
PASSWORD_RESET_URL="http://localhost:4200/password-reset"

# End-to-End Testing
E2E_DISABLE_ERROR_MIDDLEWARE="false"
E2E_GMAIL_CLIENT_ID="012345678901-abcd12a1abcdef123abcde12abcd1a1a.apps.googleusercontent.com"
E2E_GMAIL_CLIENT_SECRET="abc12ab1a1ab_abc12a1ab1a"
E2E_GMAIL_REDIRECT_URI="abc:abcd:ab:oauth:2.0:abc"
E2E_GMAIL_REFRESH_TOKEN="1/abcd1ab12a1abcde12ab-abcde1a12abcde1abc12ab"
E2E_USER_EMAIL="test@example.com"
E2E_USER_PASSWORD="password"

# JWT
JWT_SECRET="secret"

# Kafka
KAFKA_CONNECTION_STRING="kafka:9092"
KAFKA_REPLICATION_FACTOR="1"

# Mailgun
MAILGUN_DOMAIN="support.example.com"
MAILGUN_KEY="a1234a123abc12ab12a1abc123456a12-1ab1a1a1-abc1234a"

# Mongo
MONGO_CONNECTION_STRING="mongodb://mongo:27017,mongo:27018,mongo:27019/admin?replicaSet=rs0"
MONGO_DATABASE_NAME="example"

# RabbitMQ
RABBITMQ_CONNECTION_STRING="amqp://rabbitmq:5672"
