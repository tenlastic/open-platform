import * as minio from '@tenlastic/minio';
import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
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
    mongoose.AuthorizationModel.syncIndexes(),
    mongoose.AuthorizationRequestModel.syncIndexes(),
    mongoose.LoginModel.syncIndexes(),
    mongoose.NamespaceModel.syncIndexes(),
    mongoose.PasswordResetModel.syncIndexes(),
    mongoose.RefreshTokenModel.syncIndexes(),
    mongoose.SteamIntegrationModel.syncIndexes(),
    mongoose.UserModel.syncIndexes(),
    mongoose.WebSocketModel.syncIndexes(),
  ]);

  // NATS.
  await nats.connect({ connectionString: process.env.NATS_CONNECTION_STRING });
  await nats.upsertStream('api-test');
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    mongoose.AuthorizationModel.deleteMany(),
    mongoose.AuthorizationRequestModel.deleteMany(),
    mongoose.LoginModel.deleteMany(),
    mongoose.NamespaceModel.deleteMany(),
    mongoose.PasswordResetModel.deleteMany(),
    mongoose.RefreshTokenModel.deleteMany(),
    mongoose.SteamIntegrationModel.deleteMany(),
    mongoose.UserModel.deleteMany(),
    mongoose.WebSocketModel.deleteMany(),
  ]);
});
