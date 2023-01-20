import 'source-map-support/register';
import '@tenlastic/logging';

import { mongo } from './mongo';
import { nats } from './nats';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = 'aggregation-api';
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

(async () => {
  try {
    await Promise.all([
      mongo(mongoConnectionString, mongoDatabaseName),
      nats(natsConnectionString, 1 * 1000 * 1000 * 1000, mongoDatabaseName),
    ]);

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
