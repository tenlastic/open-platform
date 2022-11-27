import * as mongoose from '@tenlastic/mongoose';

before(async function () {
  // MongoDB.
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `aggregation-api-test`,
  });
  await Promise.all([
    mongoose.Authorization.syncIndexes(),
    mongoose.Group.syncIndexes(),
    mongoose.Namespace.syncIndexes(),
    mongoose.QueueMember.syncIndexes(),
    mongoose.Storefront.syncIndexes(),
    mongoose.User.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    mongoose.Authorization.deleteMany({}),
    mongoose.Group.deleteMany({}),
    mongoose.Namespace.deleteMany({}),
    mongoose.QueueMember.deleteMany({}),
    mongoose.Storefront.deleteMany({}),
    mongoose.User.deleteMany({}),
  ]);
});
