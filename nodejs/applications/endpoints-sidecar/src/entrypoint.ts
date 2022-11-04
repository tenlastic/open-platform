import { V1Pod } from '@kubernetes/client-node';
import { podApiV1 } from '@tenlastic/kubernetes';
import axios from 'axios';
import { isDeepStrictEqual } from 'util';

import { getEndpoints } from './get-endpoints';

const apiKey = process.env.API_KEY;
const container = process.env.CONTAINER;
const endpoint = process.env.ENDPOINT;
const labelSelector = process.env.ENDPOINTS_LABEL_SELECTOR;

const pods: { [key: string]: V1Pod } = {};

let previousStatus: any;
let startedUpdatingAt = 0;
let timeout: NodeJS.Timeout;

/**
 * Checks the status of the pod and saves it to the Game Server's database.
 */
(async () => {
  await watchPods();
})();

async function update() {
  const now = Date.now();
  const throttle = 2.5 * 1000;

  if (now - startedUpdatingAt < throttle) {
    clearTimeout(timeout);
    timeout = setTimeout(update, throttle - now - startedUpdatingAt);
    return;
  }

  console.log(`Updating endpoints...`);
  startedUpdatingAt = now;

  try {
    const pod = Object.values(pods).find((p) => !p.metadata.deletionTimestamp);
    const endpoints = await getEndpoints(container, pod);

    // Do not update status if nothing has changed.
    const status = { endpoints };
    if (isDeepStrictEqual(previousStatus, status)) {
      console.log('Status has not changed. Skipping update.');
      return;
    }

    const headers = { 'X-Api-Key': apiKey };
    await axios({ headers, data: { status }, method: 'put', url: endpoint });
    previousStatus = status;

    console.log('Endpoints updated successfully.');
  } catch (e) {
    console.error(e.message);

    clearTimeout(timeout);
    timeout = setTimeout(update, throttle - now - startedUpdatingAt);
  }
}

function watchPods() {
  return podApiV1.watch(
    'dynamic',
    { fieldSelector: 'status.phase!=Failed', labelSelector },
    async (type, pod) => {
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
      }
    },
    (err) => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );
}
