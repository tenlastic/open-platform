import { V1Pod } from '@kubernetes/client-node';
import { INamespace, NamespaceModel } from '@tenlastic/http';
import { podApiV1 } from '@tenlastic/kubernetes';

import dependencies from '../dependencies';

const namespace = JSON.parse(process.env.NAMESPACE_JSON) as Partial<NamespaceModel>;
const podLabelSelector = process.env.NAMESPACE_POD_LABEL_SELECTOR;

let isUpdateRequired = false;
let isUpdatingStatus = false;
const pods: { [key: string]: V1Pod } = {};

/**
 * Checks the status of the pod and saves it to the Namespace's database.
 */
export function status() {
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
        await updateNamespace();
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

async function updateNamespace() {
  if (isUpdatingStatus) {
    isUpdateRequired = true;
    return;
  }

  console.log(`Updating Namespace status...`);
  isUpdatingStatus = true;

  // Nodes.
  const nodes = Object.values(pods)
    .filter((p) => !p.metadata.deletionTimestamp)
    .map(getPodStatus);

  // Components.
  const components = nodes.reduce(
    (previous, current) => {
      if (current.phase !== 'Running') {
        return previous;
      }

      let component: INamespace.StatusComponent;
      if (current._id.includes('api')) {
        component = previous.find((p) => p.name === 'api');
      } else if (current._id.includes('connector')) {
        component = previous.find((p) => p.name === 'connector');
      } else if (current._id.includes('sidecar')) {
        component = previous.find((p) => p.name === 'sidecar');
      }

      component.current++;

      if (component.current === component.total) {
        component.phase = 'Running';
      }

      return previous;
    },
    [
      { current: 0, name: 'api', phase: 'Pending', total: 1 },
      { current: 0, name: 'connector', phase: 'Pending', total: 1 },
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

  await dependencies.namespaceService.update(namespace._id, {
    status: { components, nodes, phase, version },
  });

  console.log('Namespace updated successfully.');
  isUpdatingStatus = false;

  if (isUpdateRequired) {
    isUpdateRequired = false;
    return updateNamespace();
  }
}
