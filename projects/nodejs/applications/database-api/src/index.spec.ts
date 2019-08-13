import * as rabbitmq from '@tenlastic/rabbitmq';
import * as mongoose from 'mongoose';

import { Collection, Database } from './models';

before(async function() {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: process.env.MONGO_DATABASE_NAME,
    useFindAndModify: false,
    useNewUrlParser: true,
  });
  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
});

beforeEach(async function() {
  await Collection.deleteMany({});
  await Database.deleteMany({});
});
