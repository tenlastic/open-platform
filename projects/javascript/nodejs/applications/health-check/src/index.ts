import * as k8s from '@kubernetes/client-node';
import * as requestPromiseNative from 'request-promise-native';

const INTERVAL = 15000;

const accessToken = process.env.ACCESS_TOKEN;
const gameServerId = process.env.GAME_SERVER_ID;
const gameServerIsPersistent = process.env.GAME_SERVER_IS_PERSISTENT;
const podNamespace = process.env.POD_NAMESPACE;
const podName = process.env.POD_NAME;

// Send logs synchronously to preserve order.
let timeout: NodeJS.Timeout;
async function healthCheck() {
  try {
    console.log('Fetching container state...');

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    const { body } = await coreV1Api.readNamespacedPodStatus(podName, podNamespace);

    const containerStatus = body.status.containerStatuses.find(cs => cs.name === 'application');
    const state = Object.keys(containerStatus.state)[0];

    if (gameServerIsPersistent === 'true') {
      console.log(`Updating Game Server status: ${state}.`);

      await requestPromiseNative.put({
        headers: { Authorization: `Bearer ${accessToken}` },
        json: { status: state },
        url: `http://api.default:3000/game-servers/${gameServerId}`,
      });

      console.log('Game Server updated successfully.');
    } else if (state === 'terminated') {
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
    timeout = setTimeout(healthCheck, INTERVAL);
  }
}
timeout = setTimeout(healthCheck, INTERVAL);
