import * as mongooseModels from '@tenlastic/mongoose-models';
import * as nats from '@tenlastic/nats';

import { replicateFromMongo } from './replicate-from-mongo';
import { replicateFromNats } from './replicate-from-nats';

const mongoCollectionNames = process.env.MONGO_COLLECTION_NAMES;
const mongoFromConnectionString = process.env.MONGO_FROM_CONNECTION_STRING;
const mongoFromDatabaseName = process.env.MONGO_FROM_DATABASE_NAME;
const mongoToConnectionString = process.env.MONGO_TO_CONNECTION_STRING;
const mongoToDatabaseName = process.env.MONGO_TO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async function () {
  try {
    // MongoDB.
    const collectionNames = mongoCollectionNames ? mongoCollectionNames.split(',') : [];
    const fromConnection = await mongooseModels.createConnection({
      connectionString: mongoFromConnectionString,
      databaseName: mongoFromDatabaseName,
    });
    const toConnection = await mongooseModels.createConnection({
      connectionString: mongoToConnectionString,
      databaseName: mongoToDatabaseName,
    });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });

    const starts: { [key: string]: Date } = {};

    // Replicate from MongoDB to MongoDB.
    for (const collectionName of collectionNames) {
      const from = `${mongoFromDatabaseName}.${collectionName}`;
      const to = `${mongoToDatabaseName}.${collectionName}`;

      const consumer = await nats.getConsumer(`${podName}-${collectionName}`, from);
      if (!consumer) {
        console.log(`Replicating from MongoDB (${from}) to MongoDB (${to}).`);

        starts[collectionName] = new Date();
        const count = await replicateFromMongo(
          collectionName,
          fromConnection,
          collectionName,
          toConnection,
        );

        console.log(`Synced ${count} documents from MongoDB (${from}) to MongoDB (${to}).`);
      }
    }

    // Close the connection to the source database.
    await fromConnection.close();

    // Replicate from NATS to MongoDB.
    for (const collectionName of collectionNames) {
      const from = `${mongoFromDatabaseName}.${collectionName}`;
      const to = `${mongoToDatabaseName}.${collectionName}`;

      console.log(`Replicating from NATS (${from}) to MongoDB (${to}).`);
      replicateFromNats(collectionName, toConnection, {
        durable: `${podName}-${collectionName}`,
        start: starts[collectionName],
        subject: from,
      });
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
