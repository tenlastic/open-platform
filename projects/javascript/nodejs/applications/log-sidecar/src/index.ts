import * as k8s from '@kubernetes/client-node';
import * as kubernetes from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const endpoint = process.env.LOG_ENDPOINT;
const podNamespace = process.env.LOG_POD_NAMESPACE;
const podLabelSelector = process.env.LOG_POD_LABEL_SELECTOR;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

(async function main() {
  try {
    const pods = await coreV1Api.listNamespacedPod(
      podNamespace,
      null,
      null,
      null,
      null,
      podLabelSelector,
    );

    for (const pod of pods.body.items) {
      getLogs(pod);
    }

    // Watch for new Pods.
    const watch = new k8s.Watch(kc);
    watch.watch(
      `/api/v1/namespaces/${podNamespace}/pods`,
      { labelSelector: podLabelSelector },
      (type, object) => {
        if (type === 'ADDED') {
          getLogs(object);
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

async function getLogs(pod: k8s.V1Pod) {
  try {
    const annotations = Object.keys(pod.metadata.annotations)
      .filter(a => a.startsWith('tenlastic.com/'))
      .reduce((previous, current) => {
        const key = current.replace('tenlastic.com/', '');
        previous[key] = annotations[key];
        return previous;
      }, {});

    const mostRecentLog = await getMostRecentLogCreatedAt(annotations, pod.metadata.name);

    const emitter = kubernetes.getPodLog(
      podNamespace,
      pod.metadata.name,
      pod.spec.containers[0].name,
      mostRecentLog ? mostRecentLog : new Date(0).toISOString(),
    );
    emitter.on('data', data => saveLogs(annotations, data));
    emitter.on('error', e => {
      console.error(e);
      process.exit(1);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function getMostRecentLogCreatedAt(annotations: any, pod: string): Promise<any> {
  const query = { sort: '-createdAt', where: annotations };

  const response = await requestPromiseNative.get({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
    qs: { query: JSON.stringify(query) },
    url: endpoint,
  });

  return response.records[0] ? response.records[0].createdAt : null;
}

async function saveLogs(annotations: any, data: any) {
  try {
    await requestPromiseNative.post({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: { ...annotations, ...data },
      url: endpoint,
    });
  } catch (e) {
    console.error(e);
  }
}
