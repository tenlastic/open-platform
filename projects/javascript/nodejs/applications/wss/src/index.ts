import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongooseModels from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
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
