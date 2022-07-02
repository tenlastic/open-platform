import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongooseChangeStreamNats from '@tenlastic/mongoose-change-stream-nats';
import * as mongooseModels from '@tenlastic/mongoose-models';
import mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import nats from '@tenlastic/nats';
import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as path from 'path';
import { URL } from 'url';

import routes from './routes';

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
    mongooseModels.ArticleEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.BuildEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.DatabaseEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.FriendEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.GameEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.GameAuthorizationEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.GameServerEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.GroupEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.GroupInvitationEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.IgnorationEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.MessageEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.NamespaceEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.PasswordResetEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.QueueEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.QueueMemberEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.UserEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.WebSocketEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.WorkflowEvent.sync(mongooseChangeStreamNats.publish);

    // Web Server.
    const webServer = new WebServer();
    webServer.use(loggingMiddleware);
    webServer.use(routes);
    webServer.serve(path.resolve(__dirname, 'public'), '/', 'index.html');
    webServer.start();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

process.on('unhandledRejection', (err) => console.error(JSON.stringify(err)));
