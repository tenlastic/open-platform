import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongoose from '@tenlastic/mongoose';

import * as nats from './nats';
import * as webServer from './web-server';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

(async () => {
  try {
    // MongoDB.
    await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: 'aggregation-api',
    });

    // NATS.
    await nats.setup({
      connectionString: natsConnectionString,
      database: 'aggregation-api',
      durable: 'aggregation-api',
    });

    // Web Server.
    webServer.setup();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
