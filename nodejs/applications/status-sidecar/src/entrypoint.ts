import { V1Deployment, V1Pod, V1StatefulSet } from '@kubernetes/client-node';
import { deploymentApiV1, podApiV1, statefulSetApiV1 } from '@tenlastic/kubernetes';
import axios from 'axios';

import { version } from '../package.json';
import { getComponents } from './get-components';
import { getNodes } from './get-nodes';

const apiKey = process.env.API_KEY;
const endpoint = process.env.ENDPOINT;
const labelSelector = process.env.LABEL_SELECTOR;

const deployments: { [key: string]: V1Deployment } = {};
const pods: { [key: string]: V1Pod } = {};
const statefulSets: { [key: string]: V1StatefulSet } = {};

let isUpdateRequired = false;
let isUpdatingStatus = false;

(async () => {
  deploymentApiV1.watch(
    'dynamic',
    { labelSelector },
    async (type, deployment: V1Deployment) => {
      console.log(`Deployment - ${type}: ${deployment.metadata.name}.`);

      if (type === 'ADDED' || type === 'MODIFIED') {
        deployments[deployment.metadata.name] = deployment;
      } else if (type === 'DELETED') {
        delete deployments[deployment.metadata.name];
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

  statefulSetApiV1.watch(
    'dynamic',
    { labelSelector },
    async (type, statefulSet: V1StatefulSet) => {
      console.log(`Stateful Set - ${type}: ${statefulSet.metadata.name}.`);

      if (type === 'ADDED' || type === 'MODIFIED') {
        statefulSets[statefulSet.metadata.name] = statefulSet;
      } else if (type === 'DELETED') {
        delete statefulSets[statefulSet.metadata.name];
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

  console.log(`Updating status...`);
  isUpdatingStatus = true;

  const nodes = getNodes(Object.values(pods));
  const components = getComponents(Object.values(deployments), Object.values(statefulSets));

  console.log(JSON.stringify(components));

  // Phase.
  let phase = 'Pending';
  if (components.every((c) => c.phase === 'Running')) {
    phase = 'Running';
  } else if (nodes.some((n) => n.phase === 'Error')) {
    phase = 'Error';
  }

  // Send the status to the endpoint.
  try {
    await axios({
      headers: { 'X-Api-Key': apiKey },
      data: { status: { components, nodes, phase, version } },
      method: 'put',
      url: endpoint,
    });
  } catch (e) {
    console.error(e.response.data.errors);
  }

  console.log('Status updated successfully.');
  isUpdatingStatus = false;

  if (isUpdateRequired) {
    isUpdateRequired = false;
    return update();
  }
}
