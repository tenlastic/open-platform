import * as mongoose from 'mongoose';

import { MONGO_DATABASE_NAME } from './constants';
import { Unique } from './model';

beforeEach(async function() {
  const connectionString = process.env.MONGO_CONNECTION_STRING;
  await mongoose.connect(connectionString, {
    dbName: MONGO_DATABASE_NAME,
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await Unique.ensureIndexes();
  await Unique.deleteMany({});
});
