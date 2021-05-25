import 'source-map-support/register';

import * as kafka from '@tenlastic/kafka';
import '@tenlastic/logging';
import * as mongooseChangeStreamKafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { WebServer } from '@tenlastic/web-server';
import { WebSocketServer } from '@tenlastic/web-socket-server';

import * as handlers from './handlers';

const kafkaConnectionString = process.env.KAFKA_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async () => {
  try {
    // Kafka.
    await kafka.connect(kafkaConnectionString);

    // MongoDB.
    await mongooseModels.connect({
      connectionString: mongoConnectionString,
      databaseName: 'api',
    });

    // Send changes from MongoDB to Kafka.
    mongooseModels.QueueMemberEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.WebSocketEvent.sync(mongooseChangeStreamKafka.publish);

    // Delete stale web sockets on startup and SIGTERM.
    await deleteStaleWebSockets();
    process.on('SIGTERM', async () => {
      await deleteStaleWebSockets();
      process.exit();
    });

    // Web Server.
    const webServer = new WebServer();
    webServer.use(ctx => (ctx.status = 200));
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
  const webSockets = await mongooseModels.WebSocket.find({ nodeId: podName });
  const promises = webSockets.map(ws => ws.remove());
  return Promise.all(promises);
}
