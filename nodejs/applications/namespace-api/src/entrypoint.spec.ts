import * as minio from '@tenlastic/minio';
import * as mongoose from '@tenlastic/mongoose';
import { URL } from 'url';

before(async function () {
  // Minio.
  const minioConnectionUrl = new URL(process.env.MINIO_CONNECTION_STRING);
  minio.connect({
    accessKey: minioConnectionUrl.username,
    endPoint: minioConnectionUrl.hostname,
    port: Number(minioConnectionUrl.port || '443'),
    secretKey: minioConnectionUrl.password,
    useSSL: minioConnectionUrl.protocol === 'https:',
  });
  await minio.makeBucket(process.env.MINIO_BUCKET);

  // MongoDB.
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `namespace-api-test`,
  });
  await Promise.all([
    mongoose.ArticleModel.syncIndexes(),
    mongoose.AuthorizationModel.syncIndexes(),
    mongoose.BuildModel.syncIndexes(),
    mongoose.CollectionModel.syncIndexes(),
    mongoose.GameServerModel.syncIndexes(),
    mongoose.GroupModel.syncIndexes(),
    mongoose.NamespaceModel.syncIndexes(),
    mongoose.QueueModel.syncIndexes(),
    mongoose.QueueMemberModel.syncIndexes(),
    mongoose.StorefrontModel.syncIndexes(),
    mongoose.UserModel.syncIndexes(),
    mongoose.WebSocketModel.syncIndexes(),
    mongoose.WorkflowModel.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    mongoose.ArticleModel.deleteMany({}),
    mongoose.AuthorizationModel.deleteMany({}),
    mongoose.BuildModel.deleteMany({}),
    mongoose.CollectionModel.deleteMany({}),
    mongoose.GameServerModel.deleteMany({}),
    mongoose.GroupModel.deleteMany({}),
    mongoose.NamespaceModel.deleteMany({}),
    mongoose.QueueModel.deleteMany({}),
    mongoose.QueueMemberModel.deleteMany({}),
    mongoose.StorefrontModel.deleteMany({}),
    mongoose.UserModel.deleteMany({}),
    mongoose.WebSocketModel.deleteMany({}),
    mongoose.WorkflowModel.deleteMany({}),
  ]);
});
