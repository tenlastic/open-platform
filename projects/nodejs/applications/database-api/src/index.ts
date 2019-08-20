import 'source-map-support/register';

import * as rabbitmq from '@tenlastic/rabbitmq';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { router as collectionsRouter } from './handlers/collections';
import { router as databasesRouter } from './handlers/databases';
import { router as indexesRouter } from './handlers/indexes';
import { router as recordsRouter } from './handlers/records';
import { CollectionSchema } from './models';
import {
  CREATE_COLLECTION_INDEX_QUEUE,
  DELETE_COLLECTION_INDEX_QUEUE,
  createCollectionIndexWorker,
  deleteCollectionIndexWorker,
} from './workers';

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  dbName: process.env.MONGO_DATABASE_NAME,
  poolSize: 10,
  useFindAndModify: false,
  useNewUrlParser: true,
});

(async () => {
  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
  rabbitmq.consume(CREATE_COLLECTION_INDEX_QUEUE, createCollectionIndexWorker);
  rabbitmq.consume(DELETE_COLLECTION_INDEX_QUEUE, deleteCollectionIndexWorker);
})();

const webServer = new WebServer();
webServer.use(databasesRouter.routes());
webServer.use(collectionsRouter.routes());
webServer.use(indexesRouter.routes());
webServer.use(recordsRouter.routes());
webServer.serve(path.resolve(__dirname, '../public'), '/documentation');
webServer.start();

export { webServer };
