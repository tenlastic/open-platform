import { workflowApiV1 } from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const workflowEndpoint = process.env.WORKFLOW_ENDPOINT;
const workflowName = process.env.WORKFLOW_NAME;
const workflowNamespace = process.env.WORKFLOW_NAMESPACE;

/**
 * Checks the status of the Workflow and updates it within MongoDB.
 */
export async function status() {
  workflowApiV1.watch(
    workflowNamespace,
    { fieldSelector: `metadata.name=${workflowName}` },
    (type, object) => updateWorkflow(object),
    err => {
      console.error(err);
      process.exit(err ? 1 : 0);
    },
  );
}

async function updateWorkflow(object: any) {
  const nodes = Object.values(object.status.nodes || {});

  await requestPromiseNative.put({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { status: { ...object.status, nodes } },
    url: workflowEndpoint,
  });
}
