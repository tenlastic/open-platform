import { CoreV1Event, V1Deployment, V1Pod, V1StatefulSet } from '@kubernetes/client-node';
import {
  deploymentApiV1,
  eventApiV1,
  podApiV1,
  statefulSetApiV1,
  Watch,
} from '@tenlastic/kubernetes';
import axios from 'axios';

import { version } from '../package.json';
import { getComponents } from './get-components';
import { getMessage } from './get-message';
import { getNodes } from './get-nodes';
import { getPhase } from './get-phase';

const apiKey = process.env.API_KEY;
const endpoint = process.env.ENDPOINT;
const labelSelector = process.env.LABEL_SELECTOR;

const deployments: { [key: string]: V1Deployment } = {};
const events: { [key: string]: CoreV1Event } = {};
const pods: { [key: string]: V1Pod } = {};
const statefulSets: { [key: string]: V1StatefulSet } = {};
const watches: { [key: string]: Watch<CoreV1Event> } = {};

let isUpdateRequired = false;
let isUpdatingStatus = false;

(async () => {
  await watchDeployments();
  await watchPods();
  await watchStatefulSets();
})();

async function update() {
  if (isUpdatingStatus) {
    isUpdateRequired = true;
    return;
  }

  console.log(`Updating status...`);
  isUpdatingStatus = true;

  const d = Object.values(deployments);
  const p = Object.values(pods);
  const ss = Object.values(statefulSets);

  const components = getComponents(d, ss);
  const message = getMessage(d, events, ss);
  const nodes = getNodes(p);
  const phase = getPhase(components, message, nodes);

  // Send the status to the endpoint.
  await axios({
    headers: { 'X-Api-Key': apiKey },
    data: { status: { components, message, nodes, phase, version } },
    method: 'put',
    url: endpoint,
  });

  console.log('Status updated successfully.');
  isUpdatingStatus = false;

  if (isUpdateRequired) {
    isUpdateRequired = false;
    return update();
  }
}

function watchDeployments() {
  return deploymentApiV1.watch(
    'dynamic',
    { labelSelector },
    async (type, deployment) => {
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
      }
    },
    (err) => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );
}

function watchEvents(statefulSet: V1StatefulSet) {
  const fieldSelectors = [
    `involvedObject.kind=StatefulSet`,
    `involvedObject.name=${statefulSet.metadata.name}`,
  ];

  return eventApiV1.watch(
    'dynamic',
    { fieldSelector: fieldSelectors.join(',') },
    async (type, event) => {
      console.log(`Stateful Set Event - ${type}: ${event.metadata.name}.`);

      if (type === 'ADDED' || type === 'MODIFIED') {
        events[statefulSet.metadata.name] = event;
      } else if (type === 'DELETED') {
        delete events[statefulSet.metadata.name];
      }

      try {
        await update();
      } catch (e) {
        console.error(e.message);
      }
    },
    (err) => {
      if (!err) {
        return;
      }

      console.error(err.message);
      process.exit(1);
    },
  );
}

function watchPods() {
  return podApiV1.watch(
    'dynamic',
    { labelSelector },
    async (type, pod) => {
      console.log(`Pod - ${type}: ${pod.metadata.name}.`);

      if (
        pod.status?.message === 'Pod was terminated in response to imminent node shutdown.' ||
        type === 'DELETED'
      ) {
        delete pods[pod.metadata.name];
      } else if (type === 'ADDED' || type === 'MODIFIED') {
        pods[pod.metadata.name] = pod;
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

function watchStatefulSets() {
  return statefulSetApiV1.watch(
    'dynamic',
    { labelSelector },
    async (type, statefulSet) => {
      console.log(`Stateful Set - ${type}: ${statefulSet.metadata.name}.`);

      // Start and Stop Event watches.
      if (type === 'ADDED') {
        watches[statefulSet.metadata.name] = await watchEvents(statefulSet);
      } else if (type === 'DELETED') {
        const watch = watches[statefulSet.metadata.name];
        watch?.stop();
      }

      if (type === 'ADDED' || type === 'MODIFIED') {
        statefulSets[statefulSet.metadata.name] = statefulSet;
      } else if (type === 'DELETED') {
        delete statefulSets[statefulSet.metadata.name];
        delete watches[statefulSet.metadata.name];
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
