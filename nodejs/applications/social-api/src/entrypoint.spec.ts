import * as mongooseModels from '@tenlastic/mongoose-models';

import {
  Authorization,
  Friend,
  Group,
  GroupInvitation,
  Ignoration,
  Message,
  User,
} from './mongodb';

before(async function () {
  // MongoDB.
  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'social-api-test',
  });
  await Promise.all([
    Authorization.syncIndexes({ background: true }),
    Friend.syncIndexes({ background: true }),
    Group.syncIndexes({ background: true }),
    GroupInvitation.syncIndexes({ background: true }),
    Ignoration.syncIndexes({ background: true }),
    Message.syncIndexes({ background: true }),
    User.syncIndexes({ background: true }),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    Authorization.deleteMany({}),
    Friend.deleteMany({}),
    Group.deleteMany({}),
    GroupInvitation.deleteMany({}),
    Ignoration.deleteMany({}),
    Message.deleteMany({}),
    User.deleteMany({}),
  ]);
});
