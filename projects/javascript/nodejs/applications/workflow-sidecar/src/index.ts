import * as k8s from '@kubernetes/client-node';
import * as requestPromiseNative from 'request-promise-native';

import * as state from './state';

const INTERVAL = 5000;

const accessToken = process.env.ACCESS_TOKEN;
const workflowId = process.env.WORKFLOW_ID;
const workflowName = process.env.WORKFLOW_NAME;
const workflowNamespace = process.env.WORKFLOW_NAMESPACE;

/**
 * Checks the status of the Workflow and updates it within MongoDB.
 */
(async function main() {
  try {
    console.log('Fetching Workflow state...');

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
    const response = await customObjects.getNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      workflowNamespace,
      'workflows',
      workflowName,
    );
    await updateWorkflow(response.body);

    console.log('Watching Workflow state...');

    const watch = new k8s.Watch(kc);
    watch.watch(
      `/apis/argoproj.io/v1alpha1/namespaces/${workflowNamespace}/workflows`,
      { fieldSelector: `metadata.name=${workflowName}` },
      (type, object) => updateWorkflow(object),
      err => {
        if (err) {
          console.error(err);
        }

        setTimeout(main, INTERVAL);
      },
    );
  } catch (e) {
    if (e.name === 'StatusCodeError') {
      console.error(e.response.body);
    } else {
      console.error(e);
    }

    setTimeout(main, INTERVAL);
  }
})();

async function updateWorkflow(object: any) {
  const { status } = object;

  const nodes: any[] = Object.values(status.nodes || {});
  for (const node of nodes) {
    if (node.type !== 'Pod' && node.type !== 'Retry') {
      continue;
    }

    await state.setPhase(node.id, node.phase);
  }

  let finishedAt: string;
  if (status.finishedAt && Object.values(state.state).every(v => v.isFinished && v.isLogged)) {
    finishedAt = status.finishedAt;
  }

  await requestPromiseNative.put({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { status: { ...status, finishedAt, nodes } },
    url: `http://api.default:3000/workflows/${workflowId}`,
  });

  console.log('Workflow updated successfully.');
}
