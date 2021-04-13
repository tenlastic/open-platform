import * as k8s from '@kubernetes/client-node';
import * as requestPromiseNative from 'request-promise-native';

import { getPodLog } from './get-pod-log';

const accessToken = process.env.ACCESS_TOKEN;
const container = process.env.LOG_CONTAINER;
const endpoint = process.env.LOG_ENDPOINT;
const podNamespace = process.env.LOG_POD_NAMESPACE;
const podLabelSelector = process.env.LOG_POD_LABEL_SELECTOR;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const activePodNames: string[] = [];

(async function main() {
  try {
    // Watch for new Pods.
    const watch = new k8s.Watch(kc);
    watch.watch(
      `/api/v1/namespaces/${podNamespace}/pods`,
      { labelSelector: podLabelSelector },
      (type, pod: k8s.V1Pod) => {
        if (!activePodNames.includes(pod.metadata.name)) {
          activePodNames.push(pod.metadata.name);
          getLogs(pod);
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
  console.log(`Watching logs for pod: ${pod.metadata.name}.`);

  try {
    const annotations: any = Object.keys(pod.metadata.annotations)
      .filter(a => a.startsWith('tenlastic.com/'))
      .reduce((previous, current) => {
        const key = current.replace('tenlastic.com/', '');
        previous[key] = pod.metadata.annotations[current];
        return previous;
      }, {});

    const mostRecentLog = await getMostRecentLogCreatedAt(annotations);

    const emitter = getPodLog(podNamespace, pod.metadata.name, container, mostRecentLog);
    emitter.on('data', data => {
      return saveLogs({ nodeId: pod.metadata.name, ...annotations }, data);
    });
    emitter.on('error', e => {
      console.error(e);

      const index = activePodNames.findIndex(name => name === pod.metadata.name);
      activePodNames.splice(index, 1);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function getMostRecentLogCreatedAt(annotations: any): Promise<any> {
  const query = { sort: '-createdAt', where: annotations };

  const response = await requestPromiseNative.get({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
    qs: { query: JSON.stringify(query) },
    url: endpoint,
  });

  return response.records[0] ? response.records[0].createdAt : new Date(0).toISOString();
}

async function saveLogs(annotations: any, data: any) {
  console.log(data.body);

  try {
    await requestPromiseNative.post({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: { ...annotations, ...data },
      url: endpoint,
    });
  } catch (e) {
    console.error(e.message);
  }
}
