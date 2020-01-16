import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { router as articlesRouter } from './handlers/articles';
import { ReadonlyGame, ReadonlyNamespace, ReadonlyUser } from './models';

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: process.env.MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  kafka.subscribe(ReadonlyGame, { group: 'article-api', topic: 'game-api.games' });
  kafka.subscribe(ReadonlyNamespace, { group: 'article-api', topic: 'namespace-api.namespaces' });
  kafka.subscribe(ReadonlyUser, { group: 'article-api', topic: 'user-api.users' });
})();

const webServer = new WebServer();
webServer.use(articlesRouter.routes());
webServer.start();

export { webServer };
