import 'source-map-support/register';
import '@tenlastic/logging';

import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/mongoose-nats';

import * as minio from './minio';
import './nats';
import * as webServer from './web-server';
import * as webSocketServer from './web-socket-server';

const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async () => {
  try {
    // Minio.
    minio.setup({ connectionString: minioConnectionString });

    // MongoDB.
    await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });
    nats.subscribe({ database: mongoDatabaseName, podName }).catch((err) => {
      console.error(err);
      process.exit(1);
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
