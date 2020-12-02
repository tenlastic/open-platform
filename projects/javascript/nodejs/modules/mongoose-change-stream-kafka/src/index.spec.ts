import * as mongoose from 'mongoose';

import { connect } from './connect';

before(async function() {
  const connectionString = process.env.MONGO_CONNECTION_STRING;
  await mongoose.connect(connectionString, {
    dbName: 'mongoose-change-stream-kafka-test',
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await connect(process.env.KAFKA_CONNECTION_STRING.split(','));
});
