import 'source-map-support/register';

import * as kafka from '@tenlastic/kafka';
import '@tenlastic/logging';
import * as mongooseChangeStreamKafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { WebServer } from '@tenlastic/web-server';
import { WebSocketServer } from '@tenlastic/web-socket-server';
import * as Router from 'koa-router';

import * as handlers from './handlers';

(async () => {
  try {
    // Kafka.
    await kafka.connect(process.env.KAFKA_CONNECTION_STRING);

    // MongoDB.
    await mongooseModels.connect({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: 'api',
    });

    // Send changes from MongoDB to Kafka.
    mongooseModels.WebSocketEvent.sync(mongooseChangeStreamKafka.publish);

    // Web Server.
    const router = new Router();
    router.get('/', ctx => (ctx.status = 200));
    const webServer = new WebServer();
    webServer.use(router.routes());
    webServer.start();

    // Web Sockets.
    const webSocketServer = new WebSocketServer(webServer.server);
    webSocketServer.connection(handlers.connection);
    webSocketServer.message(handlers.message);
    webSocketServer.upgrade(handlers.upgrade);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
