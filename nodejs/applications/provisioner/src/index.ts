import 'source-map-support/register';

import '@tenlastic/logging';
import * as minio from '@tenlastic/minio';
import * as mongooseChangeStreamNats from '@tenlastic/mongoose-change-stream-nats';
import * as mongooseModels from '@tenlastic/mongoose-models';
import nats from '@tenlastic/nats';
import { WebServer } from '@tenlastic/web-server';
import { URL } from 'url';

import * as events from './events';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME || 'api';
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

(async () => {
  try {
    // Minio.
    const minioConnectionUrl = new URL(process.env.MINIO_CONNECTION_STRING);
    minio.connect({
      accessKey: minioConnectionUrl.username,
      endPoint: minioConnectionUrl.hostname,
      port: Number(minioConnectionUrl.port || '443'),
      secretKey: minioConnectionUrl.password,
      useSSL: minioConnectionUrl.protocol === 'https:',
    });
    await minio.makeBucket(process.env.MINIO_BUCKET);

    // MongoDB.
    await mongooseModels.connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });

    // Send changes from MongoDB to NATS.
    mongooseChangeStreamNats.produce();

    // Subscribe to NATS events.
    events.builds();
    events.gameServers();
    events.namespaces();
    events.queues();
    events.workflows();

    // Web Server.
    const webServer = new WebServer();
    webServer.use((ctx) => (ctx.status = 200));
    webServer.start();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

process.on('unhandledRejection', (err) => console.error(JSON.stringify(err)));
