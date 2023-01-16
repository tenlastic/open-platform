import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';

before(async function () {
  // MongoDB.
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `aggregation-api-test`,
  });
  await Promise.all([
    mongoose.AuthorizationModel.syncIndexes(),
    mongoose.GroupModel.syncIndexes(),
    mongoose.MatchInvitationModel.syncIndexes(),
    mongoose.MatchModel.syncIndexes(),
    mongoose.NamespaceModel.syncIndexes(),
    mongoose.QueueMemberModel.syncIndexes(),
    mongoose.StorefrontModel.syncIndexes(),
    mongoose.UserModel.syncIndexes(),
  ]);

  // NATS.
  await nats.connect({ connectionString: process.env.NATS_CONNECTION_STRING });
  await nats.upsertStream('aggregation-api-test');
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    mongoose.AuthorizationModel.deleteMany(),
    mongoose.GroupModel.deleteMany(),
    mongoose.MatchInvitationModel.deleteMany(),
    mongoose.MatchModel.deleteMany(),
    mongoose.NamespaceModel.deleteMany(),
    mongoose.QueueMemberModel.deleteMany(),
    mongoose.StorefrontModel.deleteMany(),
    mongoose.UserModel.deleteMany(),
  ]);
});
