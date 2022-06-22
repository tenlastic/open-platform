import * as mongoose from 'mongoose';

import { Example } from './example-model';

const connectionString = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(connectionString, { dbName: 'mongoose-permissions-test' });

beforeEach(function() {
  return Example.deleteMany({});
});