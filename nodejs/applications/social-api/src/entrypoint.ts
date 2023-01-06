import 'source-map-support/register';
import '@tenlastic/logging';

import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/mongoose-nats';

import './nats';
import * as webServer from './web-server';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = 'social-api';
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

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
      .catch((err) => console.error(err.message));

    // Web Server.
    webServer.setup();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
