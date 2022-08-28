import { IQueue, QueueModel } from '@tenlastic/http';
import { podApiV1, V1Pod } from '@tenlastic/kubernetes';

import dependencies from '../dependencies';

const podLabelSelector = process.env.QUEUE_POD_LABEL_SELECTOR;
const queue = JSON.parse(process.env.QUEUE_JSON) as Partial<QueueModel>;

let isUpdateRequired = false;
let isUpdatingStatus = false;
const pods: { [key: string]: V1Pod } = {};

/**
 * Checks the status of the pod and saves it to the Queue's database.
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
        await updateQueue();
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

async function updateQueue() {
  if (isUpdatingStatus) {
    isUpdateRequired = true;
    return;
  }

  console.log(`Updating Queue status...`);
  isUpdatingStatus = true;

  // Nodes.
  const nodes = Object.values(pods)
    .filter((p) => !p.metadata.deletionTimestamp)
    .map(getPodStatus);

  // Components.
  const replicas = dependencies.queueQuery.getEntity(queue._id).replicas;
  const components = nodes.reduce(
    (previous, current) => {
      if (current.phase !== 'Running') {
        return previous;
      }

      let component: IQueue.StatusComponent;
      if (current._id.includes('sidecar')) {
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

  await dependencies.queueService.update(queue.namespaceId, queue._id, {
    status: { components, nodes, phase, version },
  });

  console.log('Queue updated successfully.');
  isUpdatingStatus = false;

  if (isUpdateRequired) {
    isUpdateRequired = false;
    return updateQueue();
  }
}
