import * as k8s from '@kubernetes/client-node';
import * as requestPromiseNative from 'request-promise-native';

const INTERVAL = 5000;

const accessToken = process.env.ACCESS_TOKEN;
const gameServerId = process.env.GAME_SERVER_ID;
const podNamespace = process.env.POD_NAMESPACE;
const podName = process.env.POD_NAME;

let gameServer = JSON.parse(process.env.GAME_SERVER_JSON);

// Send logs synchronously to preserve order.
async function healthCheck() {
  try {
    console.log('Fetching container state...');

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    const { body } = await coreV1Api.readNamespacedPodStatus(podName, podNamespace);

    console.log(`Pod Name: ${podName} - Pod Namespace: ${podNamespace}`);
    console.log(JSON.stringify(body));

    const containerStatus = body.status.containerStatuses.find(cs => cs.name === 'application');
    console.log(`States: ${Object.keys(containerStatus.state)}`);

    let state = 'waiting';
    if (containerStatus.state.running) {
      state = 'running';
    } else if (containerStatus.state.terminated) {
      state = 'terminated';
    }

    if (gameServer.status === state) {
      throw new Error('Game Server status has not changed.');
    }

    if (gameServer.isPersistent || state !== 'terminated') {
      console.log(`Updating Game Server status: ${state}.`);

      const response = await requestPromiseNative.put({
        headers: { Authorization: `Bearer ${accessToken}` },
        json: { status: state },
        url: `http://api.default:3000/game-servers/${gameServerId}`,
      });
      gameServer = response.record;

      console.log('Game Server updated successfully.');
    } else if (!gameServer.isPersistent && state === 'terminated') {
      console.log('Deleting Game Server...');

      await requestPromiseNative.delete({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `http://api.default:3000/game-servers/${gameServerId}`,
      });

      console.log('Game Server deleted successfully.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(healthCheck, INTERVAL);
  }
}
setTimeout(healthCheck, INTERVAL);
