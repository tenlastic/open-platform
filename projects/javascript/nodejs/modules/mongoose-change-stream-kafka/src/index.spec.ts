import * as mongoose from 'mongoose';

import { connect } from './connect';
import { MONGO_DATABASE_NAME } from './constants';

before(async function() {
  const connectionString = process.env.MONGO_CONNECTION_STRING;
  await mongoose.connect(connectionString, {
    dbName: MONGO_DATABASE_NAME,
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await connect(process.env.KAFKA_CONNECTION_STRING.split(','));
});
