import mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as mongooseModels from '@tenlastic/mongoose-models';
import * as sinon from 'sinon';
import { URL } from 'url';

import {
  Authorization,
  Friend,
  Group,
  GroupInvitation,
  Ignoration,
  Login,
  Message,
  Namespace,
  PasswordReset,
  RefreshToken,
  User,
  WebSocket,
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
    databaseName: 'api-test',
  });
  await Promise.all([
    Authorization.syncIndexes({ background: true }),
    Friend.syncIndexes({ background: true }),
    Group.syncIndexes({ background: true }),
    GroupInvitation.syncIndexes({ background: true }),
    Ignoration.syncIndexes({ background: true }),
    Login.syncIndexes({ background: true }),
    Message.syncIndexes({ background: true }),
    Namespace.syncIndexes({ background: true }),
    PasswordReset.syncIndexes({ background: true }),
    RefreshToken.syncIndexes({ background: true }),
    User.syncIndexes({ background: true }),
    WebSocket.syncIndexes({ background: true }),
  ]);
});

beforeEach(async function () {
  // Mailgun.
  sandbox = sinon.createSandbox();
  mailgun.stub(sandbox);

  // MongoDB.
  await Promise.all([
    Authorization.deleteMany({}),
    Friend.deleteMany({}),
    Group.deleteMany({}),
    GroupInvitation.deleteMany({}),
    Ignoration.deleteMany({}),
    Login.deleteMany({}),
    Message.deleteMany({}),
    Namespace.deleteMany({}),
    PasswordReset.deleteMany({}),
    RefreshToken.deleteMany({}),
    User.deleteMany({}),
    WebSocket.deleteMany({}),
  ]);
});

afterEach(function () {
  sandbox.restore();
});
