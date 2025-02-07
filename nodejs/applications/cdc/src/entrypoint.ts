import 'source-map-support/register';
import '@tenlastic/logging';

import { ChangeStreamModel, connect } from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';

import { watch } from './watch';

const mongoCollectionNames = process.env.MONGO_COLLECTION_NAMES;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async function () {
  try {
    // MongoDB.
    const connection = await connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });

    const key = `cdc.${podName}.resumeToken`;
    const changeStream = await ChangeStreamModel.findOne({ key });
    const resumeToken = changeStream?.resumeToken;

    if (resumeToken) {
      console.log(`Watching ${mongoDatabaseName} for changes after ${resumeToken}...`);
    } else {
      console.log(`Watching ${mongoDatabaseName} for changes...`);
    }

    watch(mongoCollectionNames?.split(','), connection, key, resumeToken);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
