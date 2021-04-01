import * as mongooseModels from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';

before(async function() {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING);

  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `database-test`,
  });
  await mongooseModels.syncIndexes();
});

beforeEach(async function() {
  await mongooseModels.deleteAll();
});
