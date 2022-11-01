import { V1Pod } from '@kubernetes/client-node';
import { podApiV1, V1Workflow, workflowApiV1 } from '@tenlastic/kubernetes';
import axios from 'axios';

import { version } from '../package.json';

const apiKey = process.env.API_KEY;
const workflowEndpoint = process.env.WORKFLOW_ENDPOINT;
const workflowName = process.env.WORKFLOW_NAME;

const pods: { [key: string]: V1Pod } = {};

let startedUpdatingAt = 0;
let timeout: NodeJS.Timeout;

(async () => {
  await watchPods();
  await watchWorkflows();
})();

async function update(workflow: V1Workflow) {
  const now = Date.now();
  const throttle = 2.5 * 1000;

  if (now - startedUpdatingAt < throttle) {
    clearTimeout(timeout);
    timeout = setTimeout(() => update(workflow), throttle - now - startedUpdatingAt);
    return;
  }

  console.log(`Updating status...`);
  startedUpdatingAt = now;

  try {
    const nodes = Object.values(workflow.status.nodes || {}).map((n: any) => {
      const annotation = 'workflows.argoproj.io/node-id';
      const message = n.message?.includes('exceeded quota')
        ? 'Namespace Limit reached.'
        : n.message;
      const pod = Object.values(pods).find((p) => p.metadata.annotations[annotation] === n.id);

      return { ...n, container: 'main', message, pod: pod?.metadata.name };
    });

    await axios({
      data: { status: { ...workflow.status, nodes, version } },
      headers: { 'X-Api-Key': apiKey },
      method: 'put',
      url: workflowEndpoint,
    });

    console.log('Status updated successfully.');
  } catch (e) {
    console.error(e.message);

    clearTimeout(timeout);
    timeout = setTimeout(() => update(workflow), throttle - now - startedUpdatingAt);
  }
}

function watchPods() {
  return podApiV1.watch(
    'dynamic',
    { labelSelector: `workflows.argoproj.io/workflow=${workflowName}` },
    async (type, pod) => {
      console.log(`Pod - ${type}: ${pod.metadata.name}.`);

      if (type === 'ADDED' || type === 'MODIFIED') {
        pods[pod.metadata.name] = pod;
      } else if (type === 'DELETED') {
        delete pods[pod.metadata.name];
      }
    },
    (err) => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );
}

function watchWorkflows() {
  return workflowApiV1.watch(
    'dynamic',
    { fieldSelector: `metadata.name=${workflowName}` },
    async (type, workflow) => {
      console.log(`Workflow - ${type}: ${workflow.metadata.name}.`);

      try {
        await update(workflow);
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
