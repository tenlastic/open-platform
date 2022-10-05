import * as mongooseModels from '@tenlastic/mongoose-models';

before(async function () {
  // MongoDB.
  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'connector-test',
  });
});
