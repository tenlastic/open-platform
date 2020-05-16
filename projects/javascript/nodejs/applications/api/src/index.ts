import 'source-map-support/register';

import * as docker from '@tenlastic/docker-engine';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { WebServer, WebSocketServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { MINIO_BUCKET, MONGO_DATABASE_NAME } from './constants';
import { router as articlesRouter } from './handlers/articles';
import { router as collectionsRouter } from './handlers/collections';
import { router as connectionsRouter } from './handlers/connections';
import { router as databasesRouter } from './handlers/databases';
import { router as filesRouter } from './handlers/files';
import { router as friendsRouter } from './handlers/friends';
import { router as gameServersRouter } from './handlers/game-servers';
import { router as gamesRouter } from './handlers/games';
import { router as groupsRouter } from './handlers/groups';
import { router as groupInvitationsRouter } from './handlers/group-invitations';
import { router as ignorationsRouter } from './handlers/ignorations';
import { router as indexesRouter } from './handlers/indexes';
import { router as loginsRouter } from './handlers/logins';
import { router as messagesRouter } from './handlers/messages';
import { router as namespacesRouter } from './handlers/namespaces';
import { router as passwordResetsRouter } from './handlers/password-resets';
import { router as publicKeysRouter } from './handlers/public-keys';
import { router as recordsRouter } from './handlers/records';
import { router as refreshTokensRouter } from './handlers/refresh-tokens';
import { router as releaseTasksRouter } from './handlers/release-tasks';
import { router as releasesRouter } from './handlers/releases';
import { router as usersRouter } from './handlers/users';
import * as connectionSockets from './sockets/connections';
import * as groupInvitiationSockets from './sockets/group-invitations';
import * as groupSockets from './sockets/groups';
import * as messageSockets from './sockets/messages';
import * as releaseTaskSockets from './sockets/release-tasks';
import * as releaseSockets from './sockets/releases';
import * as userSockets from './sockets/users';
import {
  BUILD_RELEASE_SERVER_QUEUE,
  COPY_RELEASE_FILES_QUEUE,
  CREATE_COLLECTION_INDEX_QUEUE,
  DELETE_COLLECTION_INDEX_QUEUE,
  REMOVE_RELEASE_FILES_QUEUE,
  UNZIP_RELEASE_FILES_QUEUE,
  buildReleaseServerWorker,
  copyReleaseFilesWorker,
  createCollectionIndexWorker,
  deleteCollectionIndexWorker,
  removeReleaseFilesWorker,
  unzipReleaseFilesWorker,
} from './workers';

// Docker Engine.
docker.init({
  certPath: process.env.DOCKER_CERT_PATH,
  registryUrl: process.env.DOCKER_REGISTRY_URL,
  url: process.env.DOCKER_ENGINE_URL,
});

// Kafka.
(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
})();

// Mailgun.
mailgun.setCredentials(process.env.MAILGUN_DOMAIN, process.env.MAILGUN_KEY);

// Minio.
(async () => {
  const minioConnectionUrl = new URL(process.env.MINIO_CONNECTION_STRING);
  minio.connect({
    accessKey: minioConnectionUrl.username,
    endPoint: minioConnectionUrl.hostname,
    port: Number(minioConnectionUrl.port || '443'),
    secretKey: minioConnectionUrl.password,
    useSSL: minioConnectionUrl.protocol === 'https:',
  });

  const bucketExists = await minio.bucketExists(MINIO_BUCKET);
  if (!bucketExists) {
    await minio.makeBucket(MINIO_BUCKET);
  }
})();

// MongoDB.
const connectionString = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(connectionString, {
  dbName: MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// RabbitMQ.
(async () => {
  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
  rabbitmq.consume(BUILD_RELEASE_SERVER_QUEUE, buildReleaseServerWorker);
  rabbitmq.consume(COPY_RELEASE_FILES_QUEUE, copyReleaseFilesWorker);
  rabbitmq.consume(CREATE_COLLECTION_INDEX_QUEUE, createCollectionIndexWorker);
  rabbitmq.consume(DELETE_COLLECTION_INDEX_QUEUE, deleteCollectionIndexWorker);
  rabbitmq.consume(REMOVE_RELEASE_FILES_QUEUE, removeReleaseFilesWorker);
  rabbitmq.consume(UNZIP_RELEASE_FILES_QUEUE, unzipReleaseFilesWorker);
})();

// Web Server.
const webServer = new WebServer();
webServer.use(articlesRouter.routes());
webServer.use(articlesRouter.routes());
webServer.use(collectionsRouter.routes());
webServer.use(connectionsRouter.routes());
webServer.use(databasesRouter.routes());
webServer.use(filesRouter.routes());
webServer.use(friendsRouter.routes());
webServer.use(gameServersRouter.routes());
webServer.use(gamesRouter.routes());
webServer.use(groupsRouter.routes());
webServer.use(groupInvitationsRouter.routes());
webServer.use(ignorationsRouter.routes());
webServer.use(indexesRouter.routes());
webServer.use(loginsRouter.routes());
webServer.use(messagesRouter.routes());
webServer.use(namespacesRouter.routes());
webServer.use(passwordResetsRouter.routes());
webServer.use(publicKeysRouter.routes());
webServer.use(recordsRouter.routes());
webServer.use(refreshTokensRouter.routes());
webServer.use(releaseTasksRouter.routes());
webServer.use(releasesRouter.routes());
webServer.use(usersRouter.routes());
webServer.serve('public', '/', 'index.html');
webServer.start();

// Web Sockets.
const webSocketServer = new WebSocketServer(webServer.server);
webSocketServer.connection('/connections', connectionSockets.onConnection);
webSocketServer.connection('/group-invitations', groupInvitiationSockets.onConnection);
webSocketServer.connection('/groups', groupSockets.onConnection);
webSocketServer.connection('/messages', messageSockets.onConnection);
webSocketServer.connection('/releases', releaseSockets.onConnection);
webSocketServer.connection('/releases/:releaseId/tasks', releaseTaskSockets.onConnection);
webSocketServer.connection('/users', userSockets.onConnection);
