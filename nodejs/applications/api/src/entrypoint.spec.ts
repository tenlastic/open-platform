import mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as mongoose from '@tenlastic/mongoose';
import * as sinon from 'sinon';
import { URL } from 'url';

import {
  Authorization,
  AuthorizationRequest,
  Login,
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
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'api-test',
  });
  await Promise.all([
    Authorization.syncIndexes(),
    AuthorizationRequest.syncIndexes(),
    Login.syncIndexes(),
    Namespace.syncIndexes(),
    PasswordReset.syncIndexes(),
    RefreshToken.syncIndexes(),
    User.syncIndexes(),
    WebSocket.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // Mailgun.
  sandbox = sinon.createSandbox();
  mailgun.stub(sandbox);

  // MongoDB.
  await Promise.all([
    Authorization.deleteMany({}),
    AuthorizationRequest.deleteMany({}),
    Login.deleteMany({}),
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
