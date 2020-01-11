import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { router as articlesRouter } from './handlers/articles';
import { router as gamesRouter } from './handlers/games';
import { ReadonlyNamespace } from './models';

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
})();

const webServer = new WebServer();
webServer.use(articlesRouter.routes());
webServer.use(gamesRouter.routes());
webServer.start();

export { webServer };
