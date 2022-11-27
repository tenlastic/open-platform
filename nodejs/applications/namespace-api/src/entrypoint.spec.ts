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
    mongoose.Article.syncIndexes(),
    mongoose.Authorization.syncIndexes(),
    mongoose.Build.syncIndexes(),
    mongoose.Collection.syncIndexes(),
    mongoose.GameServer.syncIndexes(),
    mongoose.Group.syncIndexes(),
    mongoose.Namespace.syncIndexes(),
    mongoose.Queue.syncIndexes(),
    mongoose.QueueMember.syncIndexes(),
    mongoose.Storefront.syncIndexes(),
    mongoose.User.syncIndexes(),
    mongoose.WebSocket.syncIndexes(),
    mongoose.Workflow.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    mongoose.Article.deleteMany({}),
    mongoose.Authorization.deleteMany({}),
    mongoose.Build.deleteMany({}),
    mongoose.Collection.deleteMany({}),
    mongoose.GameServer.deleteMany({}),
    mongoose.Group.deleteMany({}),
    mongoose.Namespace.deleteMany({}),
    mongoose.Queue.deleteMany({}),
    mongoose.QueueMember.deleteMany({}),
    mongoose.Storefront.deleteMany({}),
    mongoose.User.deleteMany({}),
    mongoose.WebSocket.deleteMany({}),
    mongoose.Workflow.deleteMany({}),
  ]);
});
