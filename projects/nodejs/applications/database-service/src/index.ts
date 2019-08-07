import 'source-map-support/register';

import { WebServer } from '@tenlastic/api-module';
import * as mailgun from '@tenlastic/mailgun-module';
import * as rabbitmq from '@tenlastic/rabbitmq-module';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { router as collectionsRouter } from './handlers/collections';
import { router as databasesRouter } from './handlers/databases';

mailgun.setCredentials(process.env.MAILGUN_DOMAIN, process.env.MAILGUN_KEY);
mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: process.env.MONGO_DATABASE_NAME,
  poolSize: 10,
  useFindAndModify: false,
  useNewUrlParser: true,
});
rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });

const webServer = new WebServer();
webServer.use(collectionsRouter.routes());
webServer.use(databasesRouter.routes());
webServer.serve(path.resolve(__dirname, '../public'), '/documentation');
webServer.start();

export { webServer };
