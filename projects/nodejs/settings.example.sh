#!/bin/bash
set -a

# JWT
JWT_SECRET="secret"

# Mongo
MONGO_CONNECTION_STRING="mongodb://mongo:27017,mongo:27018,mongo:27019/admin?replicaSet=rs0"
MONGO_DATABASE_NAME="example"

# Password Reset
PASSWORD_RESET_URL="http://localhost:4200/reset-password"

# RabbitMQ
RABBITMQ_CONNECTION_STRING="amqp://rabbitmq:5672"
