import 'source-map-support/register';

import * as minio from '@tenlastic/minio';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { router as filesRouter } from './handlers/files';
import { router as releasesRouter } from './handlers/releases';
import { ReadonlyGame, ReadonlyNamespace, ReadonlyUser } from './models';

const minioConnectionUrl = new URL(process.env.MINIO_CONNECTION_STRING);
minio.connect({
  accessKey: minioConnectionUrl.username,
  endPoint: minioConnectionUrl.hostname,
  port: Number(minioConnectionUrl.port || '443'),
  secretKey: minioConnectionUrl.password,
  useSSL: minioConnectionUrl.protocol === 'https',
});

async () => {
  await minio.getClient().makeBucket('releases', 'us-east-1');
};

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: process.env.MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  kafka.subscribe(ReadonlyGame, { group: 'release-api', topic: 'game-api.games' });
  kafka.subscribe(ReadonlyNamespace, { group: 'release-api', topic: 'namespace-api.namespaces' });
  kafka.subscribe(ReadonlyUser, { group: 'release-api', topic: 'user-api.users' });
})();

const webServer = new WebServer();
webServer.use(filesRouter.routes());
webServer.use(releasesRouter.routes());
webServer.start();

export { webServer };
