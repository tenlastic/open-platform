import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/mongoose-nats';

import './nats';
import * as webServer from './web-server';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

(async () => {
  try {
    // MongoDB.
    await mongoose.connect({ connectionString: mongoConnectionString, databaseName: 'social-api' });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString, database: 'social-api' });
    nats
      .subscribe({ database: 'social-api', durable: 'social-api' })
      .catch((err) => console.error(err.message));

    // Web Server.
    webServer.setup();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
