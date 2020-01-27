import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { MONGO_DATABASE_NAME } from './constants';
import { router as namespacesRouter } from './handlers/namespaces';
import { ReadonlyUser } from './models';

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: MONGO_DATABASE_NAME,
  poolSize: 10,
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  kafka.subscribe(ReadonlyUser, { group: 'namespace-api', topic: 'authentication-api.users' });
})();

const webServer = new WebServer();
webServer.use(namespacesRouter.routes());
webServer.start();

export { webServer };
