import { BuildModuleModel, IBuildModuleModel, moduleQuery, moduleService } from '@tenlastic/http';
import { podApiV1, V1Pod } from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const endpoint = process.env.MODULE_ENDPOINT;
const module = JSON.parse(process.env.MODULE_JSON);
const podLabelSelector = process.env.MODULE_POD_LABEL_SELECTOR;

let isUpdateRequired = false;
let isUpdatingStatus = false;
const pods: { [key: string]: V1Pod } = {};

/**
 * Checks the status of the pod and saves it to the Module's module.
 */
export async function status() {
  // Fetch initial Module value.
  await moduleService.findOne(module._id);

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
        await updateModule();
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

async function updateModule() {
  if (isUpdatingStatus) {
    isUpdateRequired = true;
    return;
  }

  console.log(`Updating Module status...`);
  isUpdatingStatus = true;

  // Nodes.
  const nodes = Object.values(pods)
    .filter((p) => !p.metadata.deletionTimestamp)
    .map(getPodStatus);

  // Components.
  const buildModule: BuildModuleModel = moduleQuery.getEntity(module._id);
  const components = nodes.reduce(
    (previous, current) => {
      if (current.phase !== 'Running') {
        return previous;
      }

      let component: IBuildModuleModel.StatusComponent;
      let total = 0;

      if (current._id.includes('api')) {
        component = previous.find((p) => p.name === 'api');
      } else if (current._id.includes('docker-registry')) {
        component = previous.find((p) => p.name === 'docker-registry');
      } else if (current._id.includes('minio')) {
        component = previous.find((p) => p.name === 'minio');
        total = buildModule.resources.minio.replicas;
      } else if (current._id.includes('sidecar')) {
        component = previous.find((p) => p.name === 'sidecar');
      } else {
        component = previous.find((p) => p.name === 'workflow-controller');
      }

      component.replicas++;

      if (total === 0 || component.replicas === total) {
        component.phase = 'Running';
      }

      return previous;
    },
    [
      { name: 'api', phase: 'Pending', replicas: 0 },
      { name: 'docker-registry', phase: 'Pending', replicas: 0 },
      { name: 'minio', phase: 'Pending', replicas: 0 },
      { name: 'sidecar', phase: 'Pending', replicas: 0 },
      { name: 'workflow-controller', phase: 'Pending', replicas: 0 },
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

  console.log('Module updated successfully.');
  isUpdatingStatus = false;

  if (isUpdateRequired) {
    isUpdateRequired = false;
    return updateModule();
  }
}
