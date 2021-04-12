import * as k8s from '@kubernetes/client-node';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const endpoint = process.env.QUEUE_ENDPOINT;
const podLabelSelector = process.env.QUEUE_POD_LABEL_SELECTOR;
const podNamespace = process.env.QUEUE_POD_NAMESPACE;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

const pods: { [key: string]: k8s.V1Pod } = {};

/**
 * Checks the status of the pod and saves it to the Queue's database.
 */
(async function main() {
  try {
    console.log('Fetching container state...');

    // Get initial Pods.
    const listNamespacedPodResponse = await coreV1Api.listNamespacedPod(
      podNamespace,
      undefined,
      undefined,
      undefined,
      undefined,
      podLabelSelector,
    );
    for (const pod of listNamespacedPodResponse.body.items) {
      pods[pod.metadata.name] = pod;
    }

    // Watch Pods for changes.
    const watch = new k8s.Watch(kc);
    watch.watch(
      `/api/v1/namespaces/${podNamespace}/pods`,
      { labelSelector: podLabelSelector },
      async (type, pod: k8s.V1Pod) => {
        if (type === 'ADDED' || type === 'MODIFIED') {
          pods[pod.metadata.name] = pod;
        } else if (type === 'DELETED') {
          delete pods[pod.metadata.name];
        }

        try {
          await updateQueue();
        } catch (e) {
          console.error(e);
          process.exit(1);
        }
      },
      err => {
        console.error(err);
        process.exit(err ? 1 : 0);
      },
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

async function updateQueue() {
  console.log(`Updating Queue status...`);

  const nodes = Object.entries(pods).map(([key, value]) => ({
    name: value.metadata.name,
    phase: value.status.phase,
    ready:
      value.status.conditions &&
      value.status.conditions.find(c => c.status === 'True' && c.type === 'ContainersReady'),
  }));

  let phase = 'Pending';
  if (nodes.every(n => n.phase === 'Running' && n.ready)) {
    phase = 'Running';
  } else if (nodes.some(n => n.phase === 'Error')) {
    phase = 'Error';
  } else if (nodes.some(n => n.phase === 'Failed')) {
    phase = 'Failed';
  }

  await requestPromiseNative.put({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { status: { phase, nodes } },
    url: endpoint,
  });

  console.log('Queue updated successfully.');
}
