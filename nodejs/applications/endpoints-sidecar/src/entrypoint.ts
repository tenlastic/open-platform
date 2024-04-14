import 'source-map-support/register';
import '@tenlastic/logging';

import { V1Pod } from '@kubernetes/client-node';
import { podApiV1 } from '@tenlastic/kubernetes';
import axios from 'axios';
import { isDeepStrictEqual } from 'util';

import { getEndpoints } from './get-endpoints';

interface Status {
  endpoints: StatusEndpoint[];
}

interface StatusEndpoint {
  externalIp: string;
  externalPort: number;
  internalIp: string;
  internalPort: number;
  protocol: string;
}

const apiKey = process.env.API_KEY;
const container = process.env.CONTAINER;
const endpoint = process.env.ENDPOINT;
const labelSelector = process.env.LABEL_SELECTOR;

const pods: { [key: string]: V1Pod } = {};

let previousStatus: Status;
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
    const ms = throttle - (now - startedUpdatingAt);
    console.log(`Throttling update. Will try again in ${ms}ms...`);

    clearTimeout(timeout);
    timeout = setTimeout(update, ms);

    return;
  }

  console.log(`Updating endpoints...`);
  startedUpdatingAt = now;

  let status: Status;
  try {
    const pod = Object.values(pods).find((p) => !p.metadata.deletionTimestamp);
    const endpoints = await getEndpoints(container, pod);

    status = { endpoints };
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
        console.error(e);
      }
    },
    (err) => {
      console.error(err);
      process.exit(err ? 1 : 0);
    },
  );
}
