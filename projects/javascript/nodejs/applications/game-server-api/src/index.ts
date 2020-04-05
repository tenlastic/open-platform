import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { MONGO_DATABASE_NAME } from './constants';
import { router as gameServersRouter } from './handlers/game-servers';
import { ReadonlyGame, ReadonlyNamespace, ReadonlyUser } from './models';

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  kafka.subscribe(ReadonlyGame, { group: 'game-server-api', topic: 'game-api.games' });
  kafka.subscribe(ReadonlyNamespace, {
    group: 'game-server-api',
    topic: 'namespace-api.namespaces',
  });
  kafka.subscribe(ReadonlyUser, { group: 'game-server-api', topic: 'authentication-api.users' });
})();

const webServer = new WebServer();
webServer.use(gameServersRouter.routes());
webServer.start();

export { webServer };
