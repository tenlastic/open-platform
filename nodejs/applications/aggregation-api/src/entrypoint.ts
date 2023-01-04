import 'source-map-support/register';

import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/mongoose-nats';

import './nats';
import * as webServer from './web-server';
import * as webSocketServer from './web-socket-server';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = 'aggregation-api';
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async () => {
  try {
    // MongoDB.
    await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });
    nats
      .subscribe({ database: mongoDatabaseName, maxBytes: 1 * 1000 * 1000 * 1000 })
      .catch((err) => {
        console.error(err.message);
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
