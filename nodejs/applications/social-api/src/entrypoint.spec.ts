import * as mongoose from '@tenlastic/mongoose';

before(async function () {
  // MongoDB.
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'social-api-test',
  });
  await Promise.all([
    mongoose.FriendModel.syncIndexes(),
    mongoose.GroupModel.syncIndexes(),
    mongoose.GroupInvitationModel.syncIndexes(),
    mongoose.IgnorationModel.syncIndexes(),
    mongoose.MessageModel.syncIndexes(),
    mongoose.UserModel.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    mongoose.FriendModel.deleteMany(),
    mongoose.GroupModel.deleteMany(),
    mongoose.GroupInvitationModel.deleteMany(),
    mongoose.IgnorationModel.deleteMany(),
    mongoose.MessageModel.deleteMany(),
    mongoose.UserModel.deleteMany(),
  ]);
});
