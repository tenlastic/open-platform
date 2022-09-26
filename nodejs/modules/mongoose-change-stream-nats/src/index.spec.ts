import * as mongoose from '@tenlastic/mongoose-models';
import nats from '@tenlastic/nats';

before(async function () {
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'mongoose-change-stream-nats',
  });

  await nats.connect({ connectionString: process.env.NATS_CONNECTION_STRING });
});
