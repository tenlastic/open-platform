import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
import * as redis from '@tenlastic/redis';
import Redis from 'ioredis';
import { Connection } from 'mongoose';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const redisConnectionString = process.env.REDIS_CONNECTION_STRING;
const redisPassword = process.env.REDIS_PASSWORD;

let client: Redis;
let connection: Connection;

before(async function () {
  // MongoDB.
  connection = await mongoose.connect({
    connectionString: mongoConnectionString,
    databaseName: `cdc-test`,
  });

  // NATS.
  await nats.connect({ connectionString: natsConnectionString });
  await nats.upsertStream('cdc-test', { max_age: 60 * 60 * 1000 * 1000 * 1000 });

  // Redis.
  client = await redis.connect({
    connectionString: redisConnectionString,
    name: 'mymaster',
    password: redisPassword,
  });
});

export { client, connection };
