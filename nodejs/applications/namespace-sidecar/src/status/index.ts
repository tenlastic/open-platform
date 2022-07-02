import { INamespace, namespaceQuery } from '@tenlastic/http';
import { podApiV1, V1Pod } from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const endpoint = process.env.NAMESPACE_ENDPOINT;
const namespaceId = JSON.parse(process.env.NAMESPACE_ID);
const podLabelSelector = process.env.NAMESPACE_POD_LABEL_SELECTOR;

let isUpdateRequired = false;
let isUpdatingStatus = false;
const pods: { [key: string]: V1Pod } = {};

/**
 * Checks the status of the pod and saves it to the Namespace's namespace.
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
  const namespace = namespaceQuery.getEntity(namespaceId);
  const components = nodes.reduce(
    (previous, current) => {
      if (current.phase !== 'Running') {
        return previous;
      }

      let component: INamespace.StatusComponent;
      let total = 0;

      if (current._id.includes('api')) {
        component = previous.find((p) => p.name === 'api');
      } else if (current._id.includes('docker-registry')) {
        component = previous.find((p) => p.name === 'docker-registry');
      } else if (current._id.includes('minio')) {
        component = previous.find((p) => p.name === 'minio');
        total = namespace.resources.minio.replicas;
      } else if (current._id.includes('mongodb')) {
        component = previous.find((p) => p.name === 'mongodb');
        total = namespace.resources.mongodb.replicas;
      } else if (current._id.includes('nats')) {
        component = previous.find((p) => p.name === 'nats');
        total = namespace.resources.nats.replicas;
      } else if (current._id.includes('provisioner')) {
        component = previous.find((p) => p.name === 'provisioner');
      } else if (current._id.includes('sidecar')) {
        component = previous.find((p) => p.name === 'sidecar');
      } else if (current._id.includes('workflow-controller')) {
        component = previous.find((p) => p.name === 'workflow-controller');
      } else if (current._id.includes('wss')) {
        component = previous.find((p) => p.name === 'wss');
      }

      component.replicas.current++;
      component.replicas.total = total || component.replicas.current;

      if (component.replicas.current === component.replicas.total) {
        component.phase = 'Running';
      }

      return previous;
    },
    [
      { name: 'api', phase: 'Pending', replicas: { current: 0, total: 1 } },
      { name: 'docker-registry', phase: 'Pending', replicas: { current: 0, total: 1 } },
      {
        name: 'minio',
        phase: 'Pending',
        replicas: { current: 0, total: namespace.resources.minio.replicas },
      },
      {
        name: 'mongodb',
        phase: 'Pending',
        replicas: { current: 0, total: namespace.resources.mongodb.replicas },
      },
      {
        name: 'nats',
        phase: 'Pending',
        replicas: { current: 0, total: namespace.resources.nats.replicas },
      },
      { name: 'provisioner', phase: 'Pending', replicas: { current: 0, total: 1 } },
      { name: 'sidecar', phase: 'Pending', replicas: { current: 0, total: 1 } },
      { name: 'workflow-controller', phase: 'Pending', replicas: { current: 0, total: 1 } },
      { name: 'wss', phase: 'Pending', replicas: { current: 0, total: 1 } },
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

  console.log('Namespace updated successfully.');
  isUpdatingStatus = false;

  if (isUpdateRequired) {
    isUpdateRequired = false;
    return updateNamespace();
  }
}
