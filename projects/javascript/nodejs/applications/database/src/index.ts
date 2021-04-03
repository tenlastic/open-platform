import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { WebServer } from '@tenlastic/web-server';
import { WebSocketServer } from '@tenlastic/web-socket-server';

import { router as collectionsRouter } from './handlers/collections';
import { router as recordsRouter } from './handlers/records';
import * as sockets from './sockets';

const kafkaConnectionString = process.env.KAFKA_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

(async () => {
  try {
    // Kafka.
    await kafka.connect(kafkaConnectionString);

    // MongoDB.
    await mongooseModels.connect({
      connectionString: mongoConnectionString,
      databaseName: 'database',
    });

    // Web Server.
    const webServer = new WebServer();
    webServer.use(collectionsRouter.routes());
    webServer.use(recordsRouter.routes());
    webServer.start();

    // Web Sockets.
    const webSocketServer = new WebSocketServer(webServer.server);
    webSocketServer.connection(sockets.connection);
    webSocketServer.message(sockets.message);
    webSocketServer.upgrade(sockets.upgrade);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
