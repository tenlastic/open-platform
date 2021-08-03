import { podApiV1, V1Pod } from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const endpoint = process.env.DATABASE_ENDPOINT;
const podLabelSelector = process.env.DATABASE_POD_LABEL_SELECTOR;

const pods: { [key: string]: V1Pod } = {};

/**
 * Checks the status of the pod and saves it to the Database's database.
 */
export async function status() {
  podApiV1.watch(
    'dynamic',
    { labelSelector: podLabelSelector },
    async (type, pod: V1Pod) => {
      console.log(`Event - ${type}: ${pod.metadata.name}.`);

      if (type === 'ADDED' || type === 'MODIFIED') {
        pods[pod.metadata.name] = pod;
      } else if (type === 'DELETED') {
        delete pods[pod.metadata.name];
      }

      try {
        await updateDatabase();
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
    },
    err => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );
}

function getPodStatus(pod: V1Pod) {
  const isReady = pod.status.conditions?.find(
    c => c.status === 'True' && c.type === 'ContainersReady',
  );

  let phase = pod.status.phase;
  if (phase === 'Running' && !isReady) {
    phase = 'Pending';
  }

  return { _id: pod.metadata.name, phase };
}

async function updateDatabase() {
  console.log(`Updating Database status...`);

  const nodes = Object.values(pods)
    .filter(p => !p.metadata.deletionTimestamp)
    .map(getPodStatus);

  let phase = 'Pending';
  if (nodes.every(n => n.phase === 'Running')) {
    phase = 'Running';
  } else if (nodes.some(n => n.phase === 'Error')) {
    phase = 'Error';
  } else if (nodes.some(n => n.phase === 'Failed')) {
    phase = 'Failed';
  }

  await requestPromiseNative.put({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { status: { phase, nodes } },
    url: endpoint,
  });

  console.log('Database updated successfully.');
}
