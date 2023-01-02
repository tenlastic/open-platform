import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
import { getModelForClass } from '@typegoose/typegoose';

import { replicateFromMongo } from './replicate-from-mongo';
import { replicateFromNats } from './replicate-from-nats';
import { fetchSchemasFromMongo, fetchSchemasFromNats, getFromModel, getToModel } from './schemas';

const mongoCollectionNames = process.env.MONGO_COLLECTION_NAMES;
const mongoFromConnectionString = process.env.MONGO_FROM_CONNECTION_STRING;
const mongoFromDatabaseName = process.env.MONGO_FROM_DATABASE_NAME;
const mongoToConnectionString = process.env.MONGO_TO_CONNECTION_STRING;
const mongoToDatabaseName = process.env.MONGO_TO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;
const where = process.env.WHERE ? JSON.parse(process.env.WHERE) : {};

(async function () {
  try {
    // MongoDB.
    const collectionNames = mongoCollectionNames ? mongoCollectionNames.split(',') : [];
    const fromConnection = await mongoose.createConnection({
      connectionString: mongoFromConnectionString,
      databaseName: mongoFromDatabaseName,
    });
    const toConnection = await mongoose.createConnection({
      connectionString: mongoToConnectionString,
      databaseName: mongoToDatabaseName,
    });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });
    await nats.upsertStream(mongoFromDatabaseName);

    // Sync schemas from MongoDB and NATS.
    const SchemaModel = getModelForClass(mongoose.SchemaSchema, {
      existingConnection: fromConnection,
    });
    const start = new Date();
    console.log(`Fetching schemas from MongoDB (${mongoFromDatabaseName}.schemas)...`);
    await fetchSchemasFromMongo(SchemaModel, toConnection);

    console.log(`Watching NATS (${mongoFromDatabaseName}.schemas) for schema updates...`);
    fetchSchemasFromNats(mongoFromDatabaseName, fromConnection, start, toConnection).catch(
      (err) => {
        console.error(err.message);
        process.exit(1);
      },
    );

    // Replicate from MongoDB to MongoDB.
    const starts: { [key: string]: Date } = {};
    for (const collectionName of collectionNames) {
      const from = `${mongoFromDatabaseName}.${collectionName}`;
      const to = `${mongoToDatabaseName}.${collectionName}`;

      const consumer = await nats.getConsumer(`${podName}-${collectionName}`, from);
      if (!consumer) {
        console.log(`Replicating from MongoDB (${from}) to MongoDB (${to})...`);

        starts[collectionName] = new Date();
        const count = await replicateFromMongo(
          getFromModel(collectionName),
          getToModel(collectionName),
          where[collectionName],
        );

        console.log(`Synced ${count} documents from MongoDB (${from}) to MongoDB (${to})...`);
      }
    }

    // Close the connection to the source database.
    await fromConnection.close();

    // Replicate from NATS to MongoDB.
    for (const collectionName of collectionNames) {
      const from = `${mongoFromDatabaseName}.${collectionName}`;
      const to = `${mongoToDatabaseName}.${collectionName}`;

      console.log(`Replicating from NATS (${from}) to MongoDB (${to})...`);
      replicateFromNats(
        collectionName,
        { durable: `${podName}-${collectionName}`, start: starts[collectionName], subject: from },
        where[collectionName],
      );
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
