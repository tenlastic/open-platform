import * as nats from '@tenlastic/nats';
import { WebServer } from '@tenlastic/web-server';

import { replicateFromMongo } from './replicate-from-mongo';
import { replicateFromNats } from './replicate-from-nats';

const mongoFromCollectionName = process.env.MONGO_FROM_COLLECTION_NAME;
const mongoFromConnectionString = process.env.MONGO_FROM_CONNECTION_STRING;
const mongoFromDatabaseName = process.env.MONGO_FROM_DATABASE_NAME;
const mongoToCollectionName = process.env.MONGO_TO_COLLECTION_NAME;
const mongoToConnectionString = process.env.MONGO_TO_CONNECTION_STRING;
const mongoToDatabaseName = process.env.MONGO_TO_DATABASE_NAME;
const mongoWhere = process.env.MONGO_WHERE ? JSON.parse(process.env.MONGO_WHERE) : null;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async function () {
  try {
    await nats.connect({ connectionString: natsConnectionString });

    const from = `${mongoFromDatabaseName}.${mongoFromCollectionName}`;
    const to = `${mongoToDatabaseName}.${mongoToCollectionName}`;

    const consumer = await nats.getConsumer(podName, from);
    if (!consumer) {
      console.log(`Replicating from MongoDB (${from}) to MongoDB (${to}).`);
      const count = await replicateFromMongo(
        mongoFromCollectionName,
        mongoFromConnectionString,
        mongoFromDatabaseName,
        mongoToCollectionName,
        mongoToConnectionString,
        mongoToDatabaseName,
        mongoWhere,
      );
      console.log(`Successfully synced ${count} documents.`);
    }

    // Web Server.
    const webServer = new WebServer();
    webServer.use((ctx) => (ctx.status = 200));
    webServer.start();

    console.log(`Replicating from NATS (${from}) to MongoDB (${to}).`);
    await replicateFromNats(
      mongoToCollectionName,
      mongoToConnectionString,
      mongoToDatabaseName,
      { durable: podName, subject: from },
      mongoWhere,
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
