'use strict';

const url = require("url");

const connectionString = process.env.MONGO_CONNECTION_STRING;
const databaseName = url.parse(connectionString).pathname.substring(1);

module.exports = {
  changelogCollectionName: "schemaMigrations",
  migrationsDir: "migrations",
  mongodb: {
    databaseName,
    options: {
      useNewUrlParser: true
    },
    url: connectionString,
  }
};
