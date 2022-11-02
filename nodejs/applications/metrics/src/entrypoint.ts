import { V1ResourceQuota } from '@kubernetes/client-node';
import { resourceQuotaApiV1 } from '@tenlastic/kubernetes';
import * as minio from '@tenlastic/minio';
import * as mongooseModels from '@tenlastic/mongoose-models';
import * as nats from '@tenlastic/nats';
import axios from 'axios';
import { URL } from 'url';

import { getCpu } from './get-cpu';
import { getMemory } from './get-memory';
import { getMinioStorage } from './get-minio-storage';
import { getMongoStorage } from './get-mongo-storage';

const apiKey = process.env.API_KEY;
const endpoint = process.env.ENDPOINT;
const labelSelector = process.env.LABEL_SELECTOR;
const minioBucket = process.env.MINIO_BUCKET;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

const resourceQuotas: { [key: string]: V1ResourceQuota } = {};

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
  await minio.makeBucket(minioBucket);

  // MongoDB.
  await mongooseModels.connect({
    connectionString: mongoConnectionString,
    databaseName: mongoDatabaseName,
  });

  // NATS.
  await nats.connect({ connectionString: natsConnectionString });

  await watchMinioObjects();
  await watchResourceQuotas();
})();

async function update() {
  const now = Date.now();
  const throttle = 2.5 * 1000;

  if (now - startedUpdatingAt < throttle) {
    clearTimeout(timeout);
    timeout = setTimeout(update, throttle - now - startedUpdatingAt);
    return;
  }

  console.log(`Updating status...`);
  startedUpdatingAt = now;

  // Send the status to the endpoint.
  try {
    const cpu = getCpu(Object.values(resourceQuotas));
    const memory = getMemory(Object.values(resourceQuotas));
    const [minioStorage, mongoStorage] = await Promise.all([
      getMinioStorage(minioBucket),
      getMongoStorage(),
    ]);
    const storage = minioStorage + mongoStorage;

    await axios({
      headers: { 'X-Api-Key': apiKey },
      data: { status: { limits: { cpu, memory, storage } } },
      method: 'put',
      url: endpoint,
    });

    console.log('Status updated successfully.');
  } catch (e) {
    console.error(e.message);

    clearTimeout(timeout);
    timeout = setTimeout(update, throttle - now - startedUpdatingAt);
  }
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
        console.error(e.message);
      }
    },
    (err) => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );
}