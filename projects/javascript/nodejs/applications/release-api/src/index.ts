import 'source-map-support/register';

import * as minio from '@tenlastic/minio';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { WebServer, WebSocketServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { MINIO_BUCKET, MONGO_DATABASE_NAME } from './constants';
import { router as filesRouter } from './handlers/files';
import { router as releaseJobsRouter } from './handlers/release-jobs';
import { router as releasesRouter } from './handlers/releases';
import { ReadonlyGame, ReadonlyNamespace, ReadonlyUser } from './models';
import * as releaseSockets from './sockets/releases';
import * as releaseJobSockets from './sockets/release-jobs';
import {
  COPY_QUEUE,
  REMOVE_QUEUE,
  UNZIP_QUEUE,
  copyWorker,
  removeWorker,
  unzipWorker,
} from './workers';

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  kafka.subscribe(ReadonlyGame, { group: 'release-api', topic: 'game-api.games' });
  kafka.subscribe(ReadonlyNamespace, { group: 'release-api', topic: 'namespace-api.namespaces' });
  kafka.subscribe(ReadonlyUser, { group: 'release-api', topic: 'user-api.users' });
})();

(async () => {
  const minioConnectionUrl = new URL(process.env.MINIO_CONNECTION_STRING);
  minio.connect({
    accessKey: minioConnectionUrl.username,
    endPoint: minioConnectionUrl.hostname,
    port: Number(minioConnectionUrl.port || '443'),
    secretKey: minioConnectionUrl.password,
    useSSL: minioConnectionUrl.protocol === 'https:',
  });

  const bucketExists = await minio.getClient().bucketExists(MINIO_BUCKET);
  if (!bucketExists) {
    await minio.getClient().makeBucket(MINIO_BUCKET, 'us-east-1');
  }
})();

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
  rabbitmq.consume(COPY_QUEUE, copyWorker);
  rabbitmq.consume(REMOVE_QUEUE, removeWorker);
  rabbitmq.consume(UNZIP_QUEUE, unzipWorker);
})();

const webServer = new WebServer();
webServer.use(filesRouter.routes());
webServer.use(releaseJobsRouter.routes());
webServer.use(releasesRouter.routes());
webServer.start();

const webSocketServer = new WebSocketServer(webServer.server);
webSocketServer.connection('/releases', releaseSockets.onConnection);
webSocketServer.connection('/releases/:releaseId/jobs', releaseJobSockets.onConnection);

export { webServer };
