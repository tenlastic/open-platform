import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongoose from '@tenlastic/mongoose-models';
import { WebSocket } from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer, WebSocketServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import * as sockets from './sockets';

// Kafka.
(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
})();

// MongoDB.
mongoose.connect({
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
webSocketServer.connection((jwt, ws) => {
  let interval: NodeJS.Timeout;
  interval = setInterval(async () => {
    await WebSocket.findOneAndUpdate({ jti: jwt.jti }, { heartbeatAt: new Date() });
  }, 10000);

  ws.on('close', async () => await WebSocket.findOneAndDelete({ jti: jwt.jti }));
  ws.on('close', () => clearInterval(interval));
  ws.on('error', async () => await WebSocket.findOneAndDelete({ jti: jwt.jti }));
  ws.on('error', () => clearInterval(interval));
});
webSocketServer.message((data, jwt, ws) => {
  switch (data.method) {
    case 'ping':
      sockets.ping(data, jwt, ws);
      break;
    case 'subscribe':
      sockets.subscribe(data, jwt, ws);
      break;
    case 'unsubscribe':
      sockets.unsubscribe(data, jwt, ws);
      break;
  }
});
webSocketServer.upgrade(jwt => WebSocket.create({ jti: jwt.jti, userId: jwt.user._id }));
