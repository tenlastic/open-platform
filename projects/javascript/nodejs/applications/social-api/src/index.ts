import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer, WebSocketServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { MONGO_DATABASE_NAME } from './constants';
import { router as friendsRouter } from './handlers/friends';
import { router as ignorationsRouter } from './handlers/ignorations';
import { router as messagesRouter } from './handlers/messages';
import { ReadonlyUser } from './models';
import * as messageSockets from './sockets/messages';

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  kafka.subscribe(ReadonlyUser, { group: 'social-api', topic: 'user-api.users' });
})();

const webServer = new WebServer();
webServer.use(friendsRouter.routes());
webServer.use(ignorationsRouter.routes());
webServer.use(messagesRouter.routes());
webServer.start();

const webSocketServer = new WebSocketServer(webServer.server);
webSocketServer.connection('/messages', messageSockets.onConnection);

export { webServer };
