import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as minio from '@tenlastic/minio';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { MONGO_DATABASE_NAME } from './constants';
import { router as gamesRouter } from './handlers/games';
import { ReadonlyNamespace, ReadonlyUser } from './models';

const minioConnectionUrl = new URL(process.env.MINIO_CONNECTION_STRING);
minio.connect({
  accessKey: minioConnectionUrl.username,
  endPoint: minioConnectionUrl.hostname,
  port: Number(minioConnectionUrl.port || '443'),
  secretKey: minioConnectionUrl.password,
  useSSL: minioConnectionUrl.protocol === 'https:',
});

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  kafka.subscribe(ReadonlyNamespace, { group: 'game-api', topic: 'namespace-api.namespaces' });
  kafka.subscribe(ReadonlyUser, { group: 'game-api', topic: 'authentication-api.users' });
})();

const webServer = new WebServer();
webServer.use(gamesRouter.routes());
webServer.start();

export { webServer };
