import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongooseChangeStreamNats from '@tenlastic/mongoose-change-stream-nats';
import * as mongooseModels from '@tenlastic/mongoose-models';
import nats from '@tenlastic/nats';
import { WebServer } from '@tenlastic/web-server';

import * as events from './events';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

(async () => {
  try {
    // MongoDB.
    await mongooseModels.connect({ connectionString: mongoConnectionString, databaseName: 'api' });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });

    // Send changes from MongoDB to NATS.
    mongooseModels.AuthorizationEvent.sync(mongooseChangeStreamNats.publish);

    // Subscribe to NATS events.
    events.builds();
    events.gameServers();
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
