import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { router as namespacesRouter } from './handlers/namespaces';

kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: process.env.MONGO_DATABASE_NAME,
  poolSize: 10,
  useFindAndModify: false,
  useNewUrlParser: true,
});

const webServer = new WebServer();
webServer.use(namespacesRouter.routes());
webServer.serve(path.resolve(__dirname, '../public'), '/documentation');
webServer.start();

export { webServer };
