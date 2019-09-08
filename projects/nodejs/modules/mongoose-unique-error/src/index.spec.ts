import * as mongoose from 'mongoose';

import { Unique } from './model';

const connectionString = process.env.MONGO_CONNECTION_STRING;
const databaseName = process.env.MONGO_DATABASE_NAME;
mongoose.connect(connectionString, {
  dbName: databaseName,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
});

beforeEach(function() {
  return Unique.deleteMany({});
});
