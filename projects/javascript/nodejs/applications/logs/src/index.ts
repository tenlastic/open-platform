import * as k8s from '@kubernetes/client-node';
import * as kubernetes from '@tenlastic/kubernetes';
import * as request from 'request-promise-native';

const INTERVAL = 5000;

const accessToken = process.env.ACCESS_TOKEN;
const gameServerId = process.env.GAME_SERVER_ID;
const podNamespace = process.env.POD_NAMESPACE;
const podSelector = process.env.POD_SELECTOR;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

(async function main() {
  try {
    const mostRecentLog = await getMostRecentLog();

    const pods = await coreV1Api.listNamespacedPod(
      podNamespace,
      null,
      null,
      null,
      null,
      podSelector,
    );
    const pod = pods.body.items[0];
    if (!pod) {
      throw new Error(`Could not find pods with selector: ${podSelector}.`);
    }

    const emitter = kubernetes.getPodLog(
      podNamespace,
      pod.metadata.name,
      'application',
      mostRecentLog ? mostRecentLog.createdAt : new Date(0).toISOString(),
    );
    emitter.on('data', saveLogs);
    emitter.on('end', () => setTimeout(main, INTERVAL));
    emitter.on('error', e => {
      console.error(e);
      setTimeout(main, INTERVAL);
    });
  } catch (e) {
    console.error(e);
    setTimeout(main, INTERVAL);
  }
})();

async function getMostRecentLog(): Promise<any> {
  const query = { sort: '-createdAt', where: { gameServerId } };

  const response = await request.get({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
    qs: { query: JSON.stringify(query) },
    url: `http://api.default:3000/game-servers/${gameServerId}/logs`,
  });

  return response.records[0];
}

async function saveLogs(data) {
  console.log(data);

  try {
    await request.post({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: data,
      url: `http://api.default:3000/game-servers/${gameServerId}/logs`,
    });
  } catch (e) {
    console.error(e);
  }
}
