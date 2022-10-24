import * as mongooseModels from '@tenlastic/mongoose-models';

import { Authorization, Group, Namespace, QueueMember, Storefront, User } from './mongodb';

before(async function () {
  // MongoDB.
  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `aggregation-api-test`,
  });
  await Promise.all([
    Authorization.syncIndexes({ background: true }),
    Group.syncIndexes({ background: true }),
    Namespace.syncIndexes({ background: true }),
    QueueMember.syncIndexes({ background: true }),
    Storefront.syncIndexes({ background: true }),
    User.syncIndexes({ background: true }),
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
