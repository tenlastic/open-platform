import { podApiV1, V1Pod } from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const container = process.env.LOG_CONTAINER;
const endpoint = process.env.LOG_ENDPOINT;
const podLabelSelector = process.env.LOG_POD_LABEL_SELECTOR;

const pods = new Map<string, V1Pod>();

export async function logs() {
  podApiV1.watch(
    'dynamic',
    { labelSelector: podLabelSelector },
    (type, pod: V1Pod) => {
      console.log(`${type}: ${pod.metadata.name}`);
      pods.set(pod.metadata.name, pod);

      if (type === 'ADDED') {
        return getLogs(pod);
      } else if (type === 'DELETED') {
        pods.delete(pod.metadata.name);
      }
    },
    err => {
      console.error(err);
      process.exit(err ? 1 : 0);
    },
  );
}

async function getLogs(pod: V1Pod) {
  console.log(`Watching logs: ${pod.metadata.name}...`);

  try {
    const labels: any = Object.keys(pod.metadata.labels)
      .filter(a => a.startsWith('tenlastic.com/'))
      .reduce((previous, current) => {
        const key = current.replace('tenlastic.com/', '');
        previous[key] = pod.metadata.labels[current];
        return previous;
      }, {});

    const mostRecentLog = await getMostRecentLogCreatedAt(labels);

    const emitter = podApiV1.readNamespacedPodLog(
      pod.metadata.name,
      'dynamic',
      container,
      mostRecentLog,
    );
    emitter.on('data', data => saveLogs({ nodeId: pod.metadata.name, ...labels }, data));
    emitter.on('end', async () => {
      console.log(`Stopped watching logs: ${pod.metadata.name}.`);

      const p = pods.get(pod.metadata.name);
      if (p?.status?.phase === 'Pending' || p?.status?.phase === 'Running') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return getLogs(p);
      }
    });
    emitter.on('error', async e => {
      console.error(e);

      const p = pods.get(pod.metadata.name);
      if (p?.status?.phase === 'Pending' || p?.status?.phase === 'Running') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return getLogs(p);
      }
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function getMostRecentLogCreatedAt(labels: any): Promise<any> {
  const query = { sort: '-createdAt', where: labels };

  const response = await requestPromiseNative.get({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
    qs: { query: JSON.stringify(query) },
    url: endpoint,
  });

  return response.records[0] ? response.records[0].createdAt : new Date(0).toISOString();
}

async function saveLogs(labels: any, data: any) {
  console.log(data.body);

  try {
    await requestPromiseNative.post({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: { ...labels, ...data },
      url: endpoint,
    });
  } catch (e) {
    console.error(e.message);
  }
}
