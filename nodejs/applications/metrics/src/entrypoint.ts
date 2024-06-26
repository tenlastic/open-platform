import 'source-map-support/register';
import '@tenlastic/logging';

import { V1ResourceQuota } from '@kubernetes/client-node';
import { resourceQuotaApiV1 } from '@tenlastic/kubernetes';
import * as minio from '@tenlastic/minio';
import * as mongoose from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
import axios from 'axios';
import { Connection } from 'mongoose';
import { URL } from 'url';
import { isDeepStrictEqual } from 'util';

import { getCpu } from './get-cpu';
import { getMemory } from './get-memory';
import { getMinioStorage } from './get-minio-storage';
import { getMongoStorage } from './get-mongo-storage';

interface Status {
  limits: StatusLimits;
}

interface StatusLimits {
  cpu: number;
  memory: number;
  storage: number;
}

const apiKey = process.env.API_KEY;
const endpoint = process.env.ENDPOINT;
const labelSelector = process.env.LABEL_SELECTOR;
const minioBucket = process.env.MINIO_BUCKET;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

const resourceQuotas: { [key: string]: V1ResourceQuota } = {};

let connection: Connection;
let previousStatus: any;
let startedUpdatingAt = 0;
let timeout: NodeJS.Timeout;

(async () => {
  // Minio.
  const minioConnectionUrl = new URL(minioConnectionString);
  minio.connect({
    accessKey: minioConnectionUrl.username,
    endPoint: minioConnectionUrl.hostname,
    port: Number(minioConnectionUrl.port || '443'),
    secretKey: minioConnectionUrl.password,
    useSSL: minioConnectionUrl.protocol === 'https:',
  });

  // MongoDB.
  connection = await mongoose.connect({
    connectionString: mongoConnectionString,
    databaseName: mongoDatabaseName,
  });

  // NATS.
  await nats.connect({ connectionString: natsConnectionString });

  poll();
  await watchMinioObjects();
  await watchResourceQuotas();
})();

/**
 * Update status every minute.
 */
async function poll() {
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000));

  try {
    await update();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  return poll();
}

async function update() {
  const now = Date.now();
  const throttle = 2.5 * 1000;

  if (now - startedUpdatingAt < throttle) {
    const ms = throttle - (now - startedUpdatingAt);
    console.log(`Throttling update. Will try again in ${ms}ms...`);

    clearTimeout(timeout);
    timeout = setTimeout(update, ms);

    return;
  }

  console.log(`Updating status...`);
  startedUpdatingAt = now;

  let status: Status;
  try {
    const cpu = getCpu(Object.values(resourceQuotas));
    const memory = getMemory(Object.values(resourceQuotas));
    const [minioStorage, mongoStorage] = await Promise.all([
      getMinioStorage(minioBucket),
      getMongoStorage(connection),
    ]);
    const storage = minioStorage + mongoStorage;

    status = { limits: { cpu, memory, storage } };
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  // Do not update status if nothing has changed.
  if (isDeepStrictEqual(previousStatus, status)) {
    console.log('Status has not changed. Skipping update.');
    return;
  }

  try {
    const headers = { 'X-Api-Key': apiKey };
    await axios({ headers, data: { status }, method: 'patch', url: endpoint });
  } catch (e) {
    console.error(e);

    clearTimeout(timeout);
    timeout = setTimeout(update, throttle - (now - startedUpdatingAt));

    return;
  }

  console.log('Status updated successfully.');
  previousStatus = status;
}

/**
 * Update status when Minio objects have been modified.
 */
async function watchMinioObjects() {
  const events = ['s3:ObjectCreated:*', 's3:ObjectRemoved:*'];
  const emitter = await minio.listenBucketNotification(minioBucket, '', '', events);
  emitter.on('notification', update);
}

/**
 * Update status when Resource Quotas have been modified.
 */
function watchResourceQuotas() {
  return resourceQuotaApiV1.watch(
    'dynamic',
    { labelSelector },
    async (type, resourceQuota) => {
      console.log(`Resource Quota - ${type}: ${resourceQuota.metadata.name}.`);

      if (type === 'DELETED') {
        delete resourceQuotas[resourceQuota.metadata.name];
      } else if (type === 'ADDED' || type === 'MODIFIED') {
        resourceQuotas[resourceQuota.metadata.name] = resourceQuota;
      }

      try {
        await update();
      } catch (e) {
        console.error(e);
      }
    },
    (err) => {
      console.error(err);
      process.exit(err ? 1 : 0);
    },
  );
}
