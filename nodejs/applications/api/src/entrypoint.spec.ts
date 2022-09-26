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
  Friend,
  GameServer,
  Group,
  GroupInvitation,
  Ignoration,
  Login,
  Message,
  Namespace,
  PasswordReset,
  Queue,
  QueueMember,
  RefreshToken,
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
    databaseName: `api-test`,
  });
  await Promise.all([
    Article.syncIndexes({ background: true }),
    Authorization.syncIndexes({ background: true }),
    Build.syncIndexes({ background: true }),
    Collection.syncIndexes({ background: true }),
    Friend.syncIndexes({ background: true }),
    GameServer.syncIndexes({ background: true }),
    Group.syncIndexes({ background: true }),
    GroupInvitation.syncIndexes({ background: true }),
    Ignoration.syncIndexes({ background: true }),
    Login.syncIndexes({ background: true }),
    Message.syncIndexes({ background: true }),
    Namespace.syncIndexes({ background: true }),
    PasswordReset.syncIndexes({ background: true }),
    Queue.syncIndexes({ background: true }),
    QueueMember.syncIndexes({ background: true }),
    RefreshToken.syncIndexes({ background: true }),
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
    Friend.deleteMany({}),
    GameServer.deleteMany({}),
    Group.deleteMany({}),
    GroupInvitation.deleteMany({}),
    Ignoration.deleteMany({}),
    Login.deleteMany({}),
    Message.deleteMany({}),
    Namespace.deleteMany({}),
    PasswordReset.deleteMany({}),
    Queue.deleteMany({}),
    QueueMember.deleteMany({}),
    RefreshToken.deleteMany({}),
    Storefront.deleteMany({}),
    User.deleteMany({}),
    WebSocket.deleteMany({}),
    Workflow.deleteMany({}),
  ]);
});

afterEach(function () {
  sandbox.restore();
});
