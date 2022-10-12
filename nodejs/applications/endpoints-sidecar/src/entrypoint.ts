import { V1Pod } from '@kubernetes/client-node';
import { podApiV1 } from '@tenlastic/kubernetes';
import axios from 'axios';

import { getEndpoints } from './get-endpoints';

const apiKey = process.env.API_KEY;
const container = process.env.CONTAINER;
const endpoint = process.env.ENDPOINT;
const labelSelector = process.env.LABEL_SELECTOR;

const pods: { [key: string]: V1Pod } = {};

let isUpdateRequired = false;
let isUpdatingStatus = false;

/**
 * Checks the status of the pod and saves it to the Game Server's database.
 */
(async () => {
  podApiV1.watch(
    'dynamic',
    { fieldSelector: 'status.phase!=Failed', labelSelector },
    async (type, pod: V1Pod) => {
      console.log(`Pod - ${type}: ${pod.metadata.name}.`);

      if (type === 'ADDED' || type === 'MODIFIED') {
        pods[pod.metadata.name] = pod;
      } else if (type === 'DELETED') {
        delete pods[pod.metadata.name];
      }

      try {
        await update();
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
    },
    (err) => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );
})();

async function update() {
  if (isUpdatingStatus) {
    isUpdateRequired = true;
    return;
  }

  console.log(`Updating endpoints...`);
  isUpdatingStatus = true;

  // Endpoints.
  const pod = Object.values(pods).find(
    (p) =>
      !p.metadata.deletionTimestamp && p.metadata.labels['tenlastic.com/role'] === 'application',
  );
  const endpoints = await getEndpoints(container, pod);

  await axios({
    headers: { 'X-Api-Key': apiKey },
    data: { status: { endpoints } },
    method: 'put',
    url: endpoint,
  });

  console.log('Endpoints updated successfully.');
  isUpdatingStatus = false;

  if (isUpdateRequired) {
    isUpdateRequired = false;
    return update();
  }
}
