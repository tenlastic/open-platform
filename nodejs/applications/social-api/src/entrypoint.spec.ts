import * as mongoose from '@tenlastic/mongoose';

before(async function () {
  // MongoDB.
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'social-api-test',
  });
  await Promise.all([
    mongoose.Friend.syncIndexes(),
    mongoose.Group.syncIndexes(),
    mongoose.GroupInvitation.syncIndexes(),
    mongoose.Ignoration.syncIndexes(),
    mongoose.Message.syncIndexes(),
    mongoose.User.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    mongoose.Friend.deleteMany({}),
    mongoose.Group.deleteMany({}),
    mongoose.GroupInvitation.deleteMany({}),
    mongoose.Ignoration.deleteMany({}),
    mongoose.Message.deleteMany({}),
    mongoose.User.deleteMany({}),
  ]);
});
