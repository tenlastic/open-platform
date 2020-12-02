import * as mongoose from 'mongoose';

import { Example } from './plugin/model';

const connectionString = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(connectionString, {
  dbName: 'mongoose-change-stream-test',
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

beforeEach(async function() {
  await Example.deleteMany({});
});
