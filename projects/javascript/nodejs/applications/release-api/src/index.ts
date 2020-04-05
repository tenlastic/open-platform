import 'source-map-support/register';

import * as minio from '@tenlastic/minio';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as docker from '@tenlastic/docker-engine';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { WebServer, WebSocketServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { MINIO_BUCKET, MONGO_DATABASE_NAME } from './constants';
import { router as filesRouter } from './handlers/files';
import { router as releaseTasksRouter } from './handlers/release-tasks';
import { router as releasesRouter } from './handlers/releases';
import { ReadonlyGame, ReadonlyNamespace, ReadonlyUser } from './models';
import * as releaseSockets from './sockets/releases';
import * as releaseTaskSockets from './sockets/release-tasks';
import {
  BUILD_QUEUE,
  COPY_QUEUE,
  REMOVE_QUEUE,
  UNZIP_QUEUE,
  buildWorker,
  copyWorker,
  removeWorker,
  unzipWorker,
} from './workers';

docker.init({
  certPath: process.env.DOCKER_CERT_PATH,
  registryUrl: process.env.DOCKER_REGISTRY_URL,
  url: process.env.DOCKER_ENGINE_URL,
});

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  kafka.subscribe(ReadonlyGame, { group: 'release-api', topic: 'game-api.games' });
  kafka.subscribe(ReadonlyNamespace, { group: 'release-api', topic: 'namespace-api.namespaces' });
  kafka.subscribe(ReadonlyUser, { group: 'release-api', topic: 'authentication-api.users' });
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
  rabbitmq.consume(BUILD_QUEUE, buildWorker);
  rabbitmq.consume(COPY_QUEUE, copyWorker);
  rabbitmq.consume(REMOVE_QUEUE, removeWorker);
  rabbitmq.consume(UNZIP_QUEUE, unzipWorker);
})();

const webServer = new WebServer();
webServer.use(filesRouter.routes());
webServer.use(releaseTasksRouter.routes());
webServer.use(releasesRouter.routes());
webServer.start();

const webSocketServer = new WebSocketServer(webServer.server);
webSocketServer.connection('/releases', releaseSockets.onConnection);
webSocketServer.connection('/releases/:releaseId/tasks', releaseTaskSockets.onConnection);

export { webServer };
