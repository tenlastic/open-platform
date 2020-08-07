import 'source-map-support/register';

import * as docker from '@tenlastic/docker-engine';
import '@tenlastic/logging';
import * as mongoose from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import {
  BuildReleaseDockerImage,
  CopyReleaseFiles,
  CreateCollectionIndex,
  DeleteCollectionIndex,
  DeleteReleaseFiles,
  UnzipReleaseFiles,
} from '@tenlastic/rabbitmq-models';
import { WebServer, WebSocketServer } from '@tenlastic/web-server';
import * as path from 'path';

import { router as articlesRouter } from './handlers/articles';
import { router as collectionsRouter } from './handlers/collections';
import { router as connectionsRouter } from './handlers/connections';
import { router as databasesRouter } from './handlers/databases';
import { router as filesRouter } from './handlers/files';
import { router as friendsRouter } from './handlers/friends';
import { router as gameInvitationsRouter } from './handlers/game-invitations';
import { router as gameServersRouter } from './handlers/game-servers';
import { router as gamesRouter } from './handlers/games';
import { router as groupsRouter } from './handlers/groups';
import { router as groupInvitationsRouter } from './handlers/group-invitations';
import { router as ignorationsRouter } from './handlers/ignorations';
import { router as indexesRouter } from './handlers/indexes';
import { router as loginsRouter } from './handlers/logins';
import { router as logsRouter } from './handlers/logs';
import { router as matchesRouter } from './handlers/matches';
import { router as messagesRouter } from './handlers/messages';
import { router as namespacesRouter } from './handlers/namespaces';
import { router as passwordResetsRouter } from './handlers/password-resets';
import { router as publicKeysRouter } from './handlers/public-keys';
import { router as queuesRouter } from './handlers/queues';
import { router as queueMembersRouter } from './handlers/queue-members';
import { router as recordsRouter } from './handlers/records';
import { router as refreshTokensRouter } from './handlers/refresh-tokens';
import { router as releaseTasksRouter } from './handlers/release-tasks';
import { router as releasesRouter } from './handlers/releases';
import { router as usersRouter } from './handlers/users';
import * as connectionSockets from './sockets/connections';
import * as gameInvitationSockets from './sockets/game-invitations';
import * as gameServerSockets from './sockets/game-servers';
import * as groupInvitationSockets from './sockets/group-invitations';
import * as groupSockets from './sockets/groups';
import * as logSockets from './sockets/logs';
import * as matchSockets from './sockets/matches';
import * as messageSockets from './sockets/messages';
import * as queueSockets from './sockets/queues';
import * as queueMemberSockets from './sockets/queue-members';
import * as releaseTaskSockets from './sockets/release-tasks';
import * as releaseSockets from './sockets/releases';
import * as userSockets from './sockets/users';

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
mailgun.setCredentials(process.env.MAILGUN_DOMAIN, process.env.MAILGUN_SECRET);

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

  const bucket = process.env.MINIO_BUCKET;
  const bucketExists = await minio.bucketExists(bucket);
  if (!bucketExists) {
    await minio.makeBucket(bucket);
  }
})();

// MongoDB.
mongoose.connect({
  connectionString: process.env.MONGO_CONNECTION_STRING,
  databaseName: 'api',
});

// RabbitMQ.
(async () => {
  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });

  BuildReleaseDockerImage.subscribe();
  CopyReleaseFiles.subscribe();
  CreateCollectionIndex.subscribe();
  DeleteCollectionIndex.subscribe();
  DeleteReleaseFiles.subscribe();
  UnzipReleaseFiles.subscribe();
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
webServer.use(gameInvitationsRouter.routes());
webServer.use(gameServersRouter.routes());
webServer.use(gamesRouter.routes());
webServer.use(groupsRouter.routes());
webServer.use(groupInvitationsRouter.routes());
webServer.use(ignorationsRouter.routes());
webServer.use(indexesRouter.routes());
webServer.use(loginsRouter.routes());
webServer.use(logsRouter.routes());
webServer.use(matchesRouter.routes());
webServer.use(messagesRouter.routes());
webServer.use(namespacesRouter.routes());
webServer.use(passwordResetsRouter.routes());
webServer.use(publicKeysRouter.routes());
webServer.use(queuesRouter.routes());
webServer.use(queueMembersRouter.routes());
webServer.use(recordsRouter.routes());
webServer.use(refreshTokensRouter.routes());
webServer.use(releaseTasksRouter.routes());
webServer.use(releasesRouter.routes());
webServer.use(usersRouter.routes());
webServer.serve(path.resolve(__dirname, 'public'), '/', 'index.html');
webServer.start();

// Web Sockets.
const webSocketServer = new WebSocketServer(webServer.server);
webSocketServer.connection('/connections', connectionSockets.onConnection);
webSocketServer.connection('/game-invitations', gameInvitationSockets.onConnection);
webSocketServer.connection('/game-servers', gameServerSockets.onConnection);
webSocketServer.connection('/group-invitations', groupInvitationSockets.onConnection);
webSocketServer.connection('/groups', groupSockets.onConnection);
webSocketServer.connection('/logs', logSockets.onConnection);
webSocketServer.connection('/matches', matchSockets.onConnection);
webSocketServer.connection('/messages', messageSockets.onConnection);
webSocketServer.connection('/queues', queueSockets.onConnection);
webSocketServer.connection('/queues-members', queueMemberSockets.onConnection);
webSocketServer.connection('/releases', releaseSockets.onConnection);
webSocketServer.connection('/releases/:releaseId/tasks', releaseTaskSockets.onConnection);
webSocketServer.connection('/users', userSockets.onConnection);
