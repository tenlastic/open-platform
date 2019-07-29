import 'source-map-support/register';

import { WebServer } from '@tenlastic/api-module';
import * as mailgun from '@tenlastic/mailgun-module';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { router as collectionsRouter } from './handlers/collections';
import { router as databasesRouter } from './handlers/databases';

mailgun.setCredentials(process.env.MAILGUN_DOMAIN, process.env.MAILGUN_KEY);

const connectionString = process.env.MONGO_CONNECTION_STRING;
const databaseName = process.env.MONGO_DATABASE_NAME;
mongoose.connect(connectionString, {
  dbName: databaseName,
  poolSize: 25,
  useFindAndModify: false,
  useNewUrlParser: true,
});

const webServer = new WebServer();
webServer.use(collectionsRouter.routes());
webServer.use(databasesRouter.routes());
webServer.serve(path.resolve(__dirname, '../public'), '/documentation');
webServer.start();

export { webServer };
