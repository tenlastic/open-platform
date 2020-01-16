import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { router as gamesRouter } from './handlers/games';
import { ReadonlyNamespace, ReadonlyUser } from './models';

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: process.env.MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  kafka.subscribe(ReadonlyNamespace, { group: 'game-api', topic: 'namespace-api.namespaces' });
  kafka.subscribe(ReadonlyUser, { group: 'game-api', topic: 'user-api.users' });
})();

const webServer = new WebServer();
webServer.use(gamesRouter.routes());
webServer.start();

export { webServer };
