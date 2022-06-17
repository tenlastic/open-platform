import 'source-map-support/register';

import '@tenlastic/logging';
import nats from '@tenlastic/nats';
import { WebServer } from '@tenlastic/web-server';

import * as events from './events';

(async () => {
  try {
    // NATS.
    await nats.connect({ connectionString: process.env.NATS_CONNECTION_STRING });

    // Subscribe to NATS events.
    events.builds();
    events.databases();
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
