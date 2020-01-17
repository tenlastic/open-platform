'use strict';

const connectionString = process.env.MONGO_CONNECTION_STRING;
const databaseName = process.env.MONGO_DATABASE_NAME;

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
