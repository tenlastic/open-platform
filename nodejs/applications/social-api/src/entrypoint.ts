import 'source-map-support/register';

import '@tenlastic/logging';

import * as mongodb from './mongodb';
import * as nats from './nats';
import * as webServer from './web-server';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

(async () => {
  try {
    // MongoDB.
    await mongodb.setup({
      connectionString: mongoConnectionString,
      databaseName: 'social-api',
    });

    // NATS.
    await nats.setup({
      connectionString: natsConnectionString,
      database: 'social-api',
      durable: 'social-api',
    });

    // Web Server.
    webServer.setup();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();