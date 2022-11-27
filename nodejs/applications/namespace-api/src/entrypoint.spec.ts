import * as minio from '@tenlastic/minio';
import * as mongoose from '@tenlastic/mongoose';
import { URL } from 'url';

import {
  Article,
  Authorization,
  Build,
  Collection,
  GameServer,
  Group,
  Namespace,
  Queue,
  QueueMember,
  Storefront,
  User,
  WebSocket,
  Workflow,
} from './mongodb';

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
    Article.syncIndexes(),
    Authorization.syncIndexes(),
    Build.syncIndexes(),
    Collection.syncIndexes(),
    GameServer.syncIndexes(),
    Group.syncIndexes(),
    Namespace.syncIndexes(),
    Queue.syncIndexes(),
    QueueMember.syncIndexes(),
    Storefront.syncIndexes(),
    User.syncIndexes(),
    WebSocket.syncIndexes(),
    Workflow.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    Article.deleteMany({}),
    Authorization.deleteMany({}),
    Build.deleteMany({}),
    Collection.deleteMany({}),
    GameServer.deleteMany({}),
    Group.deleteMany({}),
    Namespace.deleteMany({}),
    Queue.deleteMany({}),
    QueueMember.deleteMany({}),
    Storefront.deleteMany({}),
    User.deleteMany({}),
    WebSocket.deleteMany({}),
    Workflow.deleteMany({}),
  ]);
});
