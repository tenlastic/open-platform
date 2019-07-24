'use strict';

const connectionString = process.env.MONGO_CONNECTION_STRING;
const databaseName = connectionString.match(/\/([a-z]+)\?/)[1];

module.exports = {
  changelogCollectionName: 'schemaMigrations',
  migrationsDir: 'migrations',
  mongodb: {
    databaseName,
    options: {
      useNewUrlParser: true,
    },
    url: connectionString,
  },
};
