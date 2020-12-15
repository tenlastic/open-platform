import 'source-map-support/register';

import * as docker from '@tenlastic/docker-engine';
import '@tenlastic/logging';
import * as mongoose from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { WebServer } from '@tenlastic/web-server';
import * as path from 'path';

import { router as articlesRouter } from './handlers/articles';
import { router as buildTasksRouter } from './handlers/build-tasks';
import { router as buildsRouter } from './handlers/builds';
import { router as collectionsRouter } from './handlers/collections';
import { router as filesRouter } from './handlers/files';
import { router as friendsRouter } from './handlers/friends';
import { router as gameInvitationsRouter } from './handlers/game-invitations';
import { router as gameServersRouter } from './handlers/game-servers';
import { router as gameServerLogsRouter } from './handlers/game-server-logs';
import { router as gamesRouter } from './handlers/games';
import { router as groupsRouter } from './handlers/groups';
import { router as groupInvitationsRouter } from './handlers/group-invitations';
import { router as ignorationsRouter } from './handlers/ignorations';
import { router as indexesRouter } from './handlers/indexes';
import { router as loginsRouter } from './handlers/logins';
import { router as messagesRouter } from './handlers/messages';
import { router as namespacesRouter } from './handlers/namespaces';
import { router as passwordResetsRouter } from './handlers/password-resets';
import { router as pipelinesRouter } from './handlers/pipelines';
import { router as pipelineTemplatesRouter } from './handlers/pipeline-templates';
import { router as publicKeysRouter } from './handlers/public-keys';
import { router as queuesRouter } from './handlers/queues';
import { router as queueLogsRouter } from './handlers/queue-logs';
import { router as queueMembersRouter } from './handlers/queue-members';
import { router as recordsRouter } from './handlers/records';
import { router as refreshTokensRouter } from './handlers/refresh-tokens';
import { router as usersRouter } from './handlers/users';
import { router as webSocketsRouter } from './handlers/web-sockets';

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
rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });

// Web Server.
const webServer = new WebServer();
webServer.use(articlesRouter.routes());
webServer.use(articlesRouter.routes());
webServer.use(buildTasksRouter.routes());
webServer.use(buildsRouter.routes());
webServer.use(collectionsRouter.routes());
webServer.use(filesRouter.routes());
webServer.use(friendsRouter.routes());
webServer.use(gameInvitationsRouter.routes());
webServer.use(gameServersRouter.routes());
webServer.use(gameServerLogsRouter.routes());
webServer.use(gamesRouter.routes());
webServer.use(groupsRouter.routes());
webServer.use(groupInvitationsRouter.routes());
webServer.use(ignorationsRouter.routes());
webServer.use(indexesRouter.routes());
webServer.use(loginsRouter.routes());
webServer.use(messagesRouter.routes());
webServer.use(namespacesRouter.routes());
webServer.use(passwordResetsRouter.routes());
webServer.use(pipelineTemplatesRouter.routes());
webServer.use(pipelinesRouter.routes());
webServer.use(publicKeysRouter.routes());
webServer.use(queuesRouter.routes());
webServer.use(queueLogsRouter.routes());
webServer.use(queueMembersRouter.routes());
webServer.use(recordsRouter.routes());
webServer.use(refreshTokensRouter.routes());
webServer.use(usersRouter.routes());
webServer.use(webSocketsRouter.routes());
webServer.serve(path.resolve(__dirname, 'public'), '/', 'index.html');
webServer.start();
