import * as mongoose from 'mongoose';

import { ChangeDataCapture } from './plugin/model';

const connectionString = process.env.MONGO_CONNECTION_STRING;
const databaseName = process.env.MONGO_DATABASE_NAME;
mongoose.connect(connectionString, {
  dbName: databaseName,
  useFindAndModify: false,
  useNewUrlParser: true,
});

beforeEach(async function() {
  await ChangeDataCapture.deleteMany({});
});
