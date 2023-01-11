import 'source-map-support/register';
import '@tenlastic/logging';

import { minio } from './minio';
import { mongo } from './mongo';
import { nats } from './nats';

const minioBucket = process.env.MINIO_BUCKET;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

(async () => {
  try {
    await Promise.all([
      minio(minioBucket, minioConnectionString),
      mongo(mongoConnectionString, mongoDatabaseName),
      nats(natsConnectionString, 250 * 1000 * 1000, mongoDatabaseName),
    ]);

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
