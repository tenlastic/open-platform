import * as k8s from '@kubernetes/client-node';
import * as requestPromiseNative from 'request-promise-native';

const INTERVAL = 5000;

const accessToken = process.env.ACCESS_TOKEN;
const gameServerId = process.env.GAME_SERVER_ID;
const podNamespace = process.env.POD_NAMESPACE;
const podSelector = process.env.POD_SELECTOR;

let gameServer = JSON.parse(process.env.GAME_SERVER_JSON);

/**
 * Checks the status of the pod and saves it to the Game Server's database.
 */
(async function main() {
  try {
    console.log('Fetching container state...');

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

    const pods = await coreV1Api.listNamespacedPod(
      podNamespace,
      null,
      null,
      null,
      null,
      podSelector,
    );
    const pod = pods.body.items[0];
    const { body } = await coreV1Api.readNamespacedPodStatus(pod.metadata.name, podNamespace);

    console.log(`Pod Name: ${pod.metadata.name} - Pod Namespace: ${podNamespace}`);

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
    setTimeout(main, INTERVAL);
  }
})();
