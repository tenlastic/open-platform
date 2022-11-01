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

let isUpdateRequired = false;
let isUpdatingStatus = false;

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

  // Update status when Minio objects have been modified.
  const events = ['s3:ObjectCreated:*', 's3:ObjectRemoved:*'];
  const emitter = await minio.listenBucketNotification(minioBucket, '', '', events);
  emitter.on('notification', update);

  // Update status when Resource Quotas have been modified.
  await watchResourceQuotas();
})();

async function update() {
  if (isUpdatingStatus) {
    isUpdateRequired = true;
    return;
  }

  console.log(`Updating status...`);
  isUpdatingStatus = true;

  const cpu = getCpu(Object.values(resourceQuotas));
  const memory = getMemory(Object.values(resourceQuotas));
  const [minioStorage, mongoStorage] = await Promise.all([
    getMinioStorage(minioBucket),
    getMongoStorage(),
  ]);
  const storage = minioStorage + mongoStorage;

  console.log(`CPU: ${cpu} - Memory: ${memory} - Storage: ${storage}`);
  console.log(`Minio: ${minioStorage} - MongoDB: ${mongoStorage}`);

  // Send the status to the endpoint.
  await axios({
    headers: { 'X-Api-Key': apiKey },
    data: { status: { limits: { cpu, memory, storage } } },
    method: 'put',
    url: endpoint,
  });

  console.log('Status updated successfully.');
  isUpdatingStatus = false;

  if (isUpdateRequired) {
    isUpdateRequired = false;
    return update();
  }
}

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
