import { workflowApiV1 } from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const apiKey = process.env.API_KEY;
const workflowEndpoint = process.env.WORKFLOW_ENDPOINT;
const workflowName = process.env.WORKFLOW_NAME;

/**
 * Checks the status of the Workflow and updates it within MongoDB.
 */
export async function status() {
  workflowApiV1.watch(
    'dynamic',
    { fieldSelector: `metadata.name=${workflowName}` },
    (type, object) => updateWorkflow(object),
    (err) => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );
}

async function updateWorkflow(object: any) {
  // Nodes
  const nodes = Object.values(object.status.nodes || {}).map((n: any) => ({ ...n, _id: n.id }));

  // Version
  const { version } = require('../../package.json');

  await requestPromiseNative.put({
    headers: { 'X-Api-Key': apiKey },
    json: { status: { ...object.status, nodes, version } },
    url: workflowEndpoint,
  });
}
