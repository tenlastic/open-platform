import 'source-map-support/register';
import '@tenlastic/logging';

import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
import * as redis from '@tenlastic/redis';

import { watch } from './watch';

const mongoCollectionNames = process.env.MONGO_COLLECTION_NAMES;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;
const redisConnectionString = process.env.REDIS_CONNECTION_STRING;
const redisPassword = process.env.REDIS_PASSWORD;

(async function () {
  try {
    // MongoDB.
    const connection = await mongoose.createConnection({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    // NATS.
    await nats.connect({ connectionString: natsConnectionString });

    // Redis.
    const client = await redis.connect({
      connectionString: redisConnectionString,
      name: 'mymaster',
      password: redisPassword,
    });

    const key = `cdc.${podName}.resumeToken`;
    const resumeAfter = await client.get(key);

    if (resumeAfter) {
      console.log(`Watching ${mongoDatabaseName} for changes after ${resumeAfter}...`);
    } else {
      console.log(`Watching ${mongoDatabaseName} for changes...`);
    }

    watch(client, mongoCollectionNames?.split(','), connection, key, resumeAfter);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
