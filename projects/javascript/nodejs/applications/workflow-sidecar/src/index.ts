import * as k8s from '@kubernetes/client-node';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const workflowEndpoint = process.env.WORKFLOW_ENDPOINT;
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
        console.error(err);
        process.exit(err ? 1 : 0);
      },
    );
  } catch (e) {
    if (e.name === 'StatusCodeError') {
      console.error(e.response.body);
    } else {
      console.error(e);
    }

    process.exit(1);
  }
})();

async function updateWorkflow(object: any) {
  const { status } = object;
  const nodes = Object.values(status.nodes || {});

  await requestPromiseNative.put({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { status: { ...status, nodes } },
    url: workflowEndpoint,
  });
}
