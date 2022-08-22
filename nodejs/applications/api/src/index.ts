import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongooseChangeStreamNats from '@tenlastic/mongoose-change-stream-nats';
import * as mongooseModels from '@tenlastic/mongoose-models';
import mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import nats from '@tenlastic/nats';
import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import { URL } from 'url';

import { router as articlesRouter } from './handlers/articles';
import { router as authorizationsRouter } from './handlers/authorizations';
import { router as buildsRouter } from './handlers/builds';
import { router as collectionsRouter } from './handlers/collections';
import { router as friendsRouter } from './handlers/friends';
import { router as gameServersRouter } from './handlers/game-servers';
import { router as groupsRouter } from './handlers/groups';
import { router as groupInvitationsRouter } from './handlers/group-invitations';
import { router as ignorationsRouter } from './handlers/ignorations';
import { router as loginsRouter } from './handlers/logins';
import { router as messagesRouter } from './handlers/messages';
import { router as namespacesRouter } from './handlers/namespaces';
import { router as passwordResetsRouter } from './handlers/password-resets';
import { router as publicKeysRouter } from './handlers/public-keys';
import { router as queuesRouter } from './handlers/queues';
import { router as queueMembersRouter } from './handlers/queue-members';
import { router as recordsRouter } from './handlers/records';
import { router as refreshTokensRouter } from './handlers/refresh-tokens';
import { router as storefrontsRouter } from './handlers/storefronts';
import { router as usersRouter } from './handlers/users';
import { router as webSocketsRouter } from './handlers/web-sockets';
import { router as workflowsRouter } from './handlers/workflows';

(async () => {
  try {
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

    // NATS.
    await nats.connect({ connectionString: process.env.NATS_CONNECTION_STRING });

    // Send changes from MongoDB to NATS.
    mongooseChangeStreamNats.consume('api');
    mongooseChangeStreamNats.produce();

    // Web Server.
    const webServer = new WebServer();
    webServer.use(loggingMiddleware);

    // Register web server routes.
    webServer.use(articlesRouter.routes());
    webServer.use(authorizationsRouter.routes());
    webServer.use(buildsRouter.routes());
    webServer.use(collectionsRouter.routes());
    webServer.use(friendsRouter.routes());
    webServer.use(gameServersRouter.routes());
    webServer.use(groupsRouter.routes());
    webServer.use(groupInvitationsRouter.routes());
    webServer.use(ignorationsRouter.routes());
    webServer.use(loginsRouter.routes());
    webServer.use(messagesRouter.routes());
    webServer.use(namespacesRouter.routes());
    webServer.use(passwordResetsRouter.routes());
    webServer.use(publicKeysRouter.routes());
    webServer.use(queuesRouter.routes());
    webServer.use(queueMembersRouter.routes());
    webServer.use(recordsRouter.routes());
    webServer.use(refreshTokensRouter.routes());
    webServer.use(storefrontsRouter.routes());
    webServer.use(usersRouter.routes());
    webServer.use(webSocketsRouter.routes());
    webServer.use(workflowsRouter.routes());
    webServer.serve('public', '/', 'index.html');

    // Start the web server.
    webServer.start();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

process.on('unhandledRejection', (err) => console.error(JSON.stringify(err)));
