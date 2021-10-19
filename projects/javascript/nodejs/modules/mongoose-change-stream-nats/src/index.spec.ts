import nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';

before(async function() {
  await nats.connect({ servers: process.env.NATS_CONNECTION_STRING });

  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: 'mongoose-change-stream-nats-test',
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});
