import mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as mongooseModels from '@tenlastic/mongoose-models';
import * as sinon from 'sinon';
import { URL } from 'url';

import {
  Article,
  Authorization,
  Build,
  Collection,
  GameServer,
  Namespace,
  Queue,
  QueueMember,
  Storefront,
  User,
  WebSocket,
  Workflow,
} from './mongodb';

let sandbox: sinon.SinonSandbox;

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
  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `namespace-api-test`,
  });
  await Promise.all([
    Article.syncIndexes({ background: true }),
    Authorization.syncIndexes({ background: true }),
    Build.syncIndexes({ background: true }),
    Collection.syncIndexes({ background: true }),
    GameServer.syncIndexes({ background: true }),
    Namespace.syncIndexes({ background: true }),
    Queue.syncIndexes({ background: true }),
    QueueMember.syncIndexes({ background: true }),
    Storefront.syncIndexes({ background: true }),
    User.syncIndexes({ background: true }),
    WebSocket.syncIndexes({ background: true }),
    Workflow.syncIndexes({ background: true }),
  ]);
});

beforeEach(async function () {
  // Mailgun.
  sandbox = sinon.createSandbox();
  mailgun.stub(sandbox);

  // MongoDB.
  await Promise.all([
    Article.deleteMany({}),
    Authorization.deleteMany({}),
    Build.deleteMany({}),
    Collection.deleteMany({}),
    GameServer.deleteMany({}),
    Namespace.deleteMany({}),
    Queue.deleteMany({}),
    QueueMember.deleteMany({}),
    Storefront.deleteMany({}),
    User.deleteMany({}),
    WebSocket.deleteMany({}),
    Workflow.deleteMany({}),
  ]);
});

afterEach(function () {
  sandbox.restore();
});
