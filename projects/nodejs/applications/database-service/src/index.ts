import 'source-map-support/register';

import { WebServer } from '@tenlastic/api-module';
import * as rabbitmq from '@tenlastic/rabbitmq-module';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { router as collectionsRouter } from './handlers/collections';
import { router as databasesRouter } from './handlers/databases';
import { router as indexesRouter } from './handlers/indexes';
import { CollectionSchema } from './models';
import { createCollectionIndexWorker, deleteCollectionIndexWorker } from './workers';

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: process.env.MONGO_DATABASE_NAME,
  poolSize: 10,
  useFindAndModify: false,
  useNewUrlParser: true,
});

rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
rabbitmq.consume(CollectionSchema.CREATE_INDEX_QUEUE, createCollectionIndexWorker);
rabbitmq.consume(CollectionSchema.DELETE_INDEX_QUEUE, deleteCollectionIndexWorker);

const webServer = new WebServer();
webServer.use(collectionsRouter.routes());
webServer.use(databasesRouter.routes());
webServer.use(indexesRouter.routes());
webServer.serve(path.resolve(__dirname, '../public'), '/documentation');
webServer.start();

export { webServer };
