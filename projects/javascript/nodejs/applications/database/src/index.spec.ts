import * as mongooseModels from '@tenlastic/mongoose-models';

before(async function() {
  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `database-test`,
  });
  await mongooseModels.syncIndexes();
});

beforeEach(async function() {
  await mongooseModels.deleteAll();
});
