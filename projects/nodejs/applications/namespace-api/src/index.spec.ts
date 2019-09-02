import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { Namespace, ReadonlyUser } from './models';

before(async function() {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: process.env.MONGO_DATABASE_NAME,
    useFindAndModify: false,
    useNewUrlParser: true,
  });
});

beforeEach(async function() {
  await Namespace.deleteMany({});
  await ReadonlyUser.deleteMany({});
});
