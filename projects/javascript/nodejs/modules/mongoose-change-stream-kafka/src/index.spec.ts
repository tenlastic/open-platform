import * as mongoose from 'mongoose';

import { connect } from './connect';
import { MONGO_DATABASE_NAME } from './constants';

const connectionString = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(connectionString, {
  dbName: MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

before(async function() {
  await connect(process.env.KAFKA_CONNECTION_STRING.split(','));
});
