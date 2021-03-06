import 'source-map-support/register';

import * as kafka from '@tenlastic/kafka';
import '@tenlastic/logging';
import * as mongooseChangeStreamKafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongooseModels from '@tenlastic/mongoose-models';
import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import { WebServer } from '@tenlastic/web-server';
import * as path from 'path';
import { URL } from 'url';

import { router as articlesRouter } from './handlers/articles';
import { router as buildLogsRouter } from './handlers/build-logs';
import { router as buildsRouter } from './handlers/builds';
import { router as databasesRouter } from './handlers/databases';
import { router as friendsRouter } from './handlers/friends';
import { router as gameAuthorizationsRouter } from './handlers/game-authorizations';
import { router as gameServersRouter } from './handlers/game-servers';
import { router as gameServerLogsRouter } from './handlers/game-server-logs';
import { router as gamesRouter } from './handlers/games';
import { router as groupsRouter } from './handlers/groups';
import { router as groupInvitationsRouter } from './handlers/group-invitations';
import { router as ignorationsRouter } from './handlers/ignorations';
import { router as loginsRouter } from './handlers/logins';
import { router as messagesRouter } from './handlers/messages';
import { router as namespacesRouter } from './handlers/namespaces';
import { router as passwordResetsRouter } from './handlers/password-resets';
import { router as publicKeysRouter } from './handlers/public-keys';
import { router as queuesRouter } from './handlers/queues';
import { router as queueLogsRouter } from './handlers/queue-logs';
import { router as queueMembersRouter } from './handlers/queue-members';
import { router as refreshTokensRouter } from './handlers/refresh-tokens';
import { router as usersRouter } from './handlers/users';
import { router as webSocketsRouter } from './handlers/web-sockets';
import { router as workflowsRouter } from './handlers/workflows';
import { router as workflowLogsRouter } from './handlers/workflow-logs';

(async () => {
  try {
    // Kafka.
    await kafka.connect(process.env.KAFKA_CONNECTION_STRING);

    // Mailgun.
    mailgun.setCredentials(process.env.MAILGUN_DOMAIN, process.env.MAILGUN_SECRET);

    // Minio.
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

    // MongoDB.
    await mongooseModels.connect({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: 'api',
    });

    // Send changes from MongoDB to Kafka.
    mongooseModels.ArticleEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.BuildEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.BuildLogEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.DatabaseEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.FriendEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.GameEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.GameAuthorizationEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.GameServerEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.GameServerLogEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.GroupEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.GroupInvitationEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.IgnorationEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.MessageEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.NamespaceEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.PasswordResetEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.QueueEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.QueueLogEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.QueueMemberEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.UserEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.WebSocketEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.WorkflowEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.WorkflowLogEvent.sync(mongooseChangeStreamKafka.publish);

    // Web Server.
    const webServer = new WebServer();
    webServer.use(articlesRouter.routes());
    webServer.use(buildLogsRouter.routes());
    webServer.use(buildsRouter.routes());
    webServer.use(databasesRouter.routes());
    webServer.use(friendsRouter.routes());
    webServer.use(gameAuthorizationsRouter.routes());
    webServer.use(gameServersRouter.routes());
    webServer.use(gameServerLogsRouter.routes());
    webServer.use(gamesRouter.routes());
    webServer.use(groupsRouter.routes());
    webServer.use(groupInvitationsRouter.routes());
    webServer.use(ignorationsRouter.routes());
    webServer.use(loginsRouter.routes());
    webServer.use(messagesRouter.routes());
    webServer.use(namespacesRouter.routes());
    webServer.use(passwordResetsRouter.routes());
    webServer.use(publicKeysRouter.routes());
    webServer.use(queuesRouter.routes());
    webServer.use(queueLogsRouter.routes());
    webServer.use(queueMembersRouter.routes());
    webServer.use(refreshTokensRouter.routes());
    webServer.use(usersRouter.routes());
    webServer.use(webSocketsRouter.routes());
    webServer.use(workflowsRouter.routes());
    webServer.use(workflowLogsRouter.routes());
    webServer.serve(path.resolve(__dirname, 'public'), '/', 'index.html');
    webServer.start();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

process.on('unhandledRejection', err => console.error(JSON.stringify(err)));
