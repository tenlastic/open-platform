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
    databaseName: 'api-test',
  });
  await Promise.all([
    mongoose.Authorization.syncIndexes(),
    mongoose.AuthorizationRequest.syncIndexes(),
    mongoose.Login.syncIndexes(),
    mongoose.Namespace.syncIndexes(),
    mongoose.PasswordReset.syncIndexes(),
    mongoose.RefreshToken.syncIndexes(),
    mongoose.User.syncIndexes(),
    mongoose.WebSocket.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    mongoose.Authorization.deleteMany({}),
    mongoose.AuthorizationRequest.deleteMany({}),
    mongoose.Login.deleteMany({}),
    mongoose.Namespace.deleteMany({}),
    mongoose.PasswordReset.deleteMany({}),
    mongoose.RefreshToken.deleteMany({}),
    mongoose.User.deleteMany({}),
    mongoose.WebSocket.deleteMany({}),
  ]);
});
