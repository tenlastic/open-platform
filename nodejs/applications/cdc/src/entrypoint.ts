import * as mongooseModels from '@tenlastic/mongoose-models';
import * as nats from '@tenlastic/nats';
import * as redis from '@tenlastic/redis';
import { watch } from './watch';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;
const redisConnectionString = process.env.REDIS_CONNECTION_STRING;
const redisPassword = process.env.REDIS_PASSWORD;

(async function () {
  try {
    // MongoDB.
    const connection = await mongooseModels.createConnection({
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

    console.log(`Watching ${mongoDatabaseName} for changes...`);

    const key = `cdc.${podName}.resumeToken`;
    const resumeAfter = await client.get(key);

    watch(client, connection, key, resumeAfter);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
