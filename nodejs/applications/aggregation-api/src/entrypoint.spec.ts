import * as mongoose from '@tenlastic/mongoose';

import { Authorization, Group, Namespace, QueueMember, Storefront, User } from './mongodb';

before(async function () {
  // MongoDB.
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `aggregation-api-test`,
  });
  await Promise.all([
    Authorization.syncIndexes(),
    Group.syncIndexes(),
    Namespace.syncIndexes(),
    QueueMember.syncIndexes(),
    Storefront.syncIndexes(),
    User.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    Authorization.deleteMany({}),
    Group.deleteMany({}),
    Namespace.deleteMany({}),
    QueueMember.deleteMany({}),
    Storefront.deleteMany({}),
    User.deleteMany({}),
  ]);
});
