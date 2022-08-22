import nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';

before(async function () {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: 'mongoose-change-stream-nats-test',
  });

  await nats.connect({ connectionString: process.env.NATS_CONNECTION_STRING });
});
