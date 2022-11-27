import * as mongoose from '@tenlastic/mongoose';

import { Friend, Group, GroupInvitation, Ignoration, Message, User } from './mongodb';

before(async function () {
  // MongoDB.
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'social-api-test',
  });
  await Promise.all([
    Friend.syncIndexes(),
    Group.syncIndexes(),
    GroupInvitation.syncIndexes(),
    Ignoration.syncIndexes(),
    Message.syncIndexes(),
    User.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    Friend.deleteMany({}),
    Group.deleteMany({}),
    GroupInvitation.deleteMany({}),
    Ignoration.deleteMany({}),
    Message.deleteMany({}),
    User.deleteMany({}),
  ]);
});
