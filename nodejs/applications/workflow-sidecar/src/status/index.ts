import { workflowApiV1 } from '@tenlastic/kubernetes';
import axios from 'axios';

import { version } from '../../package.json';

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
    async (type, workflow) => {
      console.log(`Event - ${type}: ${workflow.metadata.name}.`);

      try {
        await updateWorkflow(workflow);
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

async function updateWorkflow(object: any) {
  // Nodes
  const nodes = Object.values(object.status.nodes || {}).map((n: any) => ({ ...n, _id: n.id }));

  // Version
  return axios({
    data: { status: { ...object.status, nodes, version } },
    headers: { 'X-Api-Key': apiKey },
    method: 'put',
    url: workflowEndpoint,
  });
}
