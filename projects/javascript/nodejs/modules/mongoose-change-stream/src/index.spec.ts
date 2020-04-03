import * as mongoose from 'mongoose';

import { MONGO_DATABASE_NAME } from './constants';
import { Example } from './plugin/model';

const connectionString = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(connectionString, {
  dbName: MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

beforeEach(async function() {
  await Example.deleteMany({});
});
