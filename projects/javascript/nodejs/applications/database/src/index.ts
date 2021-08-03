import 'source-map-support/register';

import * as kafka from '@tenlastic/kafka';
import * as mongooseChangeStreamKafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import { WebSocketServer } from '@tenlastic/web-socket-server';

import { router as collectionsRouter } from './handlers/collections';
import { router as recordsRouter } from './handlers/records';
import * as sockets from './sockets';

const kafkaConnectionString = process.env.KAFKA_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async () => {
  try {
    // Kafka.
    await kafka.connect(kafkaConnectionString);

    // MongoDB.
    const mongoose = await mongooseModels.connect({
      connectionString: mongoConnectionString,
      databaseName: 'database',
    });
    mongoose.connection.on('error', e => {
      console.error(e);
      process.exit(1);
    });

    // Send changes from MongoDB to Kafka.
    mongooseModels.CollectionEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.RecordEvent.sync(mongooseChangeStreamKafka.publish);
    mongooseModels.WebSocketEvent.sync(mongooseChangeStreamKafka.publish);

    // Delete stale web sockets on startup and SIGTERM.
    await deleteStaleWebSockets();
    process.on('SIGTERM', async () => {
      await deleteStaleWebSockets();
      process.exit();
    });

    // Web Server.
    const webServer = new WebServer();
    webServer.use(loggingMiddleware);

    // Register web server routes.
    webServer.use(collectionsRouter.routes());
    webServer.use(recordsRouter.routes());

    // Start the web server.
    webServer.start();

    // Web Sockets.
    const webSocketServer = new WebSocketServer(webServer.server);
    webSocketServer.connection(sockets.connection);
    webSocketServer.message(sockets.message);
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
