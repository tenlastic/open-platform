import 'source-map-support/register';

import '@tenlastic/logging';

import * as minio from './minio';
import * as mongodb from './mongodb';
import * as nats from './nats';
import * as webServer from './web-server';
import * as webSocketServer from './web-socket-server';

const minioBucket = process.env.MINIO_BUCKET;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async () => {
  try {
    // Minio.
    await minio.setup({ bucket: minioBucket, connectionString: minioConnectionString });

    // MongoDB.
    await mongodb.setup({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    // NATS.
    await nats.setup({
      connectionString: natsConnectionString,
      database: mongoDatabaseName,
      durable: mongoDatabaseName,
      podName,
    });

    // Web Server.
    const { server } = webServer.setup();

    // Web Socket Server.
    await webSocketServer.setup({ podName, server });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
