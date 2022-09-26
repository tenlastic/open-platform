import 'source-map-support/register';

import '@tenlastic/logging';
import mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as mongooseModels from '@tenlastic/mongoose-models';
import nats from '@tenlastic/nats';
import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import { WebSocketServer } from '@tenlastic/web-socket-server';
import { URL } from 'url';

import * as events from './events';
import { WebSocket } from './mongodb';
import routes from './routes';
import * as sockets from './sockets';

const mailgunDomain = process.env.MAILGUN_DOMAIN;
const mailgunSecret = process.env.MAILGUN_SECRET;
const minioBucket = process.env.MINIO_BUCKET;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME || 'api';
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async () => {
  try {
    // Mailgun.
    mailgun.setCredentials(mailgunDomain, mailgunSecret);

    // Minio.
    const minioConnectionUrl = new URL(minioConnectionString);
    minio.connect({
      accessKey: minioConnectionUrl.username,
      endPoint: minioConnectionUrl.hostname,
      port: Number(minioConnectionUrl.port || '443'),
      secretKey: minioConnectionUrl.password,
      useSSL: minioConnectionUrl.protocol === 'https:',
    });
    await minio.makeBucket(minioBucket);

    // MongoDB.
    await mongooseModels.connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });

    // Register event handlers for NATS messages.
    events.setup(mongoDatabaseName).catch(console.error);

    // Web Server.
    const webServer = new WebServer(loggingMiddleware);
    webServer.use(routes);
    webServer.serve('public', '/', 'index.html');
    webServer.start();

    // Delete stale web sockets on startup and SIGTERM.
    await WebSocket.disconnectByNodeId(podName);
    process.on('SIGTERM', async () => {
      await WebSocket.disconnectByNodeId(podName);
      process.exit();
    });

    // Web Sockets.
    const webSocketServer = new WebSocketServer(webServer.server);
    webSocketServer.connection(sockets.connection);
    webSocketServer.message(sockets.message);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

process.on('unhandledRejection', (err) => console.error(JSON.stringify(err)));
