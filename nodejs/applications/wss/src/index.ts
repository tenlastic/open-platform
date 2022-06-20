import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongooseChangeStreamNats from '@tenlastic/mongoose-change-stream-nats';
import * as mongooseModels from '@tenlastic/mongoose-models';
import nats from '@tenlastic/nats';
import { WebServer } from '@tenlastic/web-server';
import { WebSocketServer } from '@tenlastic/web-socket-server';

import * as handlers from './handlers';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async () => {
  try {
    // MongoDB.
    await mongooseModels.connect({
      connectionString: mongoConnectionString,
      databaseName: 'api',
    });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });

    // Send changes from MongoDB to NATS.
    mongooseModels.QueueMemberEvent.sync(mongooseChangeStreamNats.publish);
    mongooseModels.WebSocketEvent.sync(mongooseChangeStreamNats.publish);

    // Delete stale web sockets on startup and SIGTERM.
    await deleteStaleWebSockets();
    process.on('SIGTERM', async () => {
      await deleteStaleWebSockets();
      process.exit();
    });

    // Web Server.
    const webServer = new WebServer();
    webServer.use((ctx) => (ctx.status = 200));
    webServer.start();

    // Web Sockets.
    const webSocketServer = new WebSocketServer(webServer.server);
    webSocketServer.connection(handlers.connection);
    webSocketServer.message(handlers.message);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

async function deleteStaleWebSockets() {
  const webSockets = await mongooseModels.WebSocket.find({
    disconnectedAt: { $exists: false },
    nodeId: podName,
  });

  const promises = webSockets.map(async (ws) => {
    ws.disconnectedAt = new Date();
    return ws.save();
  });

  return Promise.all(promises);
}
