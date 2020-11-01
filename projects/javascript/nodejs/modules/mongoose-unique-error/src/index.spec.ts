import * as mongoose from 'mongoose';

import { Unique } from './model';

beforeEach(async function() {
  const connectionString = process.env.MONGO_CONNECTION_STRING;
  await mongoose.connect(connectionString, {
    dbName: 'mongoose-unique-error-test',
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await Unique.ensureIndexes();
  await Unique.deleteMany({});
});
