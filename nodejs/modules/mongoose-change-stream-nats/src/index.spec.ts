import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';

before(async function () {
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'mongoose-change-stream-nats',
  });

  await nats.connect({ connectionString: process.env.NATS_CONNECTION_STRING });
  await nats.upsertStream('mongoose-change-stream-nats', { max_age: 60 * 60 * 1000 * 1000 * 1000 });
});
