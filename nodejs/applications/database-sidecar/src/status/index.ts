import { databaseQuery, databaseService, IDatabase } from '@tenlastic/http';
import { podApiV1, V1Pod } from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const database = JSON.parse(process.env.DATABASE_JSON);
const endpoint = process.env.DATABASE_ENDPOINT;
const podLabelSelector = process.env.DATABASE_POD_LABEL_SELECTOR;

let isUpdateRequired = false;
let isUpdatingStatus = false;
const pods: { [key: string]: V1Pod } = {};

/**
 * Checks the status of the pod and saves it to the Database's database.
 */
export async function status() {
  // Fetch initial Database value.
  await databaseService.findOne(database._id);

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
    (err) => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );
}

function getPodStatus(pod: V1Pod) {
  const isReady = pod.status.conditions?.find(
    (c) => c.status === 'True' && c.type === 'ContainersReady',
  );

  let phase = pod.status.phase;
  if (phase === 'Running' && !isReady) {
    phase = 'Pending';
  }

  return { _id: pod.metadata.name, phase };
}

async function updateDatabase() {
  if (isUpdatingStatus) {
    isUpdateRequired = true;
    return;
  }

  console.log(`Updating Database status...`);
  isUpdatingStatus = true;

  // Nodes.
  const nodes = Object.values(pods)
    .filter((p) => !p.metadata.deletionTimestamp)
    .map(getPodStatus);

  // Components.
  const replicas = databaseQuery.getEntity(database._id).replicas;
  const components = nodes.reduce(
    (previous, current) => {
      if (current.phase !== 'Running') {
        return previous;
      }

      let component: IDatabase.StatusComponent;
      if (current._id.includes('mongodb')) {
        component = previous.find((p) => p.name === 'mongodb');
      } else if (current._id.includes('nats')) {
        component = previous.find((p) => p.name === 'nats');
      } else if (current._id.includes('sidecar')) {
        component = previous.find((p) => p.name === 'sidecar');
      } else {
        component = previous.find((p) => p.name === 'application');
      }

      component.current++;

      if (component.current === component.total) {
        component.phase = 'Running';
      }

      return previous;
    },
    [
      { current: 0, name: 'application', phase: 'Pending', total: replicas },
      { current: 0, name: 'mongodb', phase: 'Pending', total: replicas },
      { current: 0, name: 'nats', phase: 'Pending', total: replicas },
      { current: 0, name: 'sidecar', phase: 'Pending', total: 1 },
    ],
  );

  // Phase.
  let phase = 'Pending';
  if (components.every((c) => c.phase === 'Running')) {
    phase = 'Running';
  } else if (nodes.some((n) => n.phase === 'Error')) {
    phase = 'Error';
  } else if (nodes.some((n) => n.phase === 'Failed')) {
    phase = 'Failed';
  }

  // Version
  const { version } = require('../../package.json');

  await requestPromiseNative.put({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { status: { components, phase, nodes, version } },
    url: endpoint,
  });

  console.log('Database updated successfully.');
  isUpdatingStatus = false;

  if (isUpdateRequired) {
    isUpdateRequired = false;
    return updateDatabase();
  }
}