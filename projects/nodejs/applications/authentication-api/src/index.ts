import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mailgun from '@tenlastic/mailgun';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { router as loginsRouter } from './handlers/logins';
import { router as passwordResetsRouter } from './handlers/password-resets';
import { router as usersRouter } from './handlers/users';

kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
mailgun.setCredentials(process.env.MAILGUN_DOMAIN, process.env.MAILGUN_KEY);

const connectionString = process.env.MONGO_CONNECTION_STRING;
const databaseName = process.env.MONGO_DATABASE_NAME;
mongoose.connect(connectionString, {
  dbName: databaseName,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const webServer = new WebServer();
webServer.use(loginsRouter.routes());
webServer.use(passwordResetsRouter.routes());
webServer.use(usersRouter.routes());
webServer.serve(path.resolve(__dirname, '../public'), '/documentation');
webServer.start();

export { webServer };
