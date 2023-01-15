import 'source-map-support/register';
import '@tenlastic/logging';

import { CoreV1Event, V1Deployment, V1Job, V1Pod, V1StatefulSet } from '@kubernetes/client-node';
import {
  deploymentApiV1,
  eventApiV1,
  jobApiV1,
  podApiV1,
  statefulSetApiV1,
  Watch,
} from '@tenlastic/kubernetes';
import axios from 'axios';
import { isDeepStrictEqual } from 'util';

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
const jobs: { [key: string]: V1Job } = {};
const pods: { [key: string]: V1Pod } = {};
const statefulSets: { [key: string]: V1StatefulSet } = {};
const watches: { [key: string]: Watch<CoreV1Event> } = {};

let previousStatus: any;
let startedUpdatingAt = 0;
let timeout: NodeJS.Timeout;

(async () => {
  await Promise.all([getDeployments(), getJobs(), getPods(), getStatefulSets()]);
  await update();

  await watchDeployments();
  await watchJobs();
  await watchPods();
  await watchStatefulSets();
})();

async function getDeployments() {
  const ds = await deploymentApiV1.list('dynamic', { labelSelector });
  for (const d of ds.body.items) {
    deployments[d.metadata.name] = d;
  }
}

async function getJobs() {
  const js = await jobApiV1.list('dynamic', { labelSelector });
  for (const j of js.body.items) {
    jobs[j.metadata.name] = j;
  }
}

async function getPods() {
  const ps = await podApiV1.list('dynamic', { labelSelector });
  for (const p of ps.body.items) {
    pods[p.metadata.name] = p;
  }
}

async function getStatefulSets() {
  const sss = await statefulSetApiV1.list('dynamic', { labelSelector });
  for (const ss of sss.body.items) {
    statefulSets[ss.metadata.name] = ss;
  }
}

async function update() {
  const now = Date.now();
  const throttle = 2.5 * 1000;

  if (now - startedUpdatingAt < throttle) {
    clearTimeout(timeout);
    timeout = setTimeout(update, throttle - now - startedUpdatingAt);
    return;
  }

  console.log(`Updating status...`);
  startedUpdatingAt = now;

  try {
    const d = Object.values(deployments);
    const j = Object.values(jobs);
    const p = Object.values(pods);
    const ss = Object.values(statefulSets);

    const components = getComponents(d, j, ss);
    const message = getMessage(d, events, j, ss);
    const nodes = getNodes(p);
    const phase = getPhase(components, nodes);

    // Do not update status if nothing has changed.
    const status = { components, message, nodes, phase, version };
    if (isDeepStrictEqual(previousStatus, status)) {
      console.log('Status has not changed. Skipping update.');
      return;
    }

    const headers = { 'X-Api-Key': apiKey };
    await axios({ headers, data: { status }, method: 'patch', url: endpoint });
    previousStatus = status;

    console.log('Status updated successfully.');
  } catch (e) {
    console.error(e.message);

    clearTimeout(timeout);
    timeout = setTimeout(update, throttle - now - startedUpdatingAt);
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

function watchJobs() {
  return jobApiV1.watch(
    'dynamic',
    { labelSelector },
    async (type, job) => {
      console.log(`Job - ${type}: ${job.metadata.name}.`);

      if (type === 'ADDED' || type === 'MODIFIED') {
        jobs[job.metadata.name] = job;
      } else if (type === 'DELETED') {
        delete jobs[job.metadata.name];
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

function watchPods() {
  return podApiV1.watch(
    'dynamic',
    { labelSelector },
    async (type, pod) => {
      console.log(`Pod - ${type}: ${pod.metadata.name}.`);

      if (
        pod.status.message === 'Pod was terminated in response to imminent node shutdown.' ||
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
