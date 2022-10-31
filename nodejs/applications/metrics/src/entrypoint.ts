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
import { getNatsStorage } from './get-nats-storage';

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

  resourceQuotaApiV1.watch(
    'dynamic',
    { labelSelector },
    async (type, object) => {
      console.log(`Resource Quota - ${type}: ${object.metadata.name}.`);

      if (type === 'DELETED') {
        delete resourceQuotas[object.metadata.name];
      } else if (type === 'ADDED' || type === 'MODIFIED') {
        resourceQuotas[object.metadata.name] = object;
      }

      try {
        await update();
      } catch (e) {
        handleError(e);
      }
    },
    handleError,
  );
})();

function handleError(error: Error) {
  if (error?.message === 'aborted') {
    return;
  }

  console.error(error?.message);
  process.exit(error ? 1 : 0);
}

async function update() {
  if (isUpdatingStatus) {
    isUpdateRequired = true;
    return;
  }

  console.log(`Updating status...`);
  isUpdatingStatus = true;

  const cpu = getCpu(Object.values(resourceQuotas));
  const memory = getMemory(Object.values(resourceQuotas));
  const [minioStorage, mongoStorage, natsStorage] = await Promise.all([
    getMinioStorage(minioBucket),
    getMongoStorage(),
    getNatsStorage(minioBucket),
  ]);
  const storage = minioStorage + mongoStorage + natsStorage;

  console.log(`CPU: ${cpu} - Memory: ${memory} - Storage: ${storage}`);
  console.log(`Minio: ${minioStorage} - MongoDB: ${mongoStorage} - NATS: ${natsStorage}`);

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
