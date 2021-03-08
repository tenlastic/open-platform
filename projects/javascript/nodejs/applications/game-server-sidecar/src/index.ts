import * as k8s from '@kubernetes/client-node';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const container = process.env.GAME_SERVER_CONTAINER;
const endpoint = process.env.GAME_SERVER_ENDPOINT;
const podLabelSelector = process.env.GAME_SERVER_POD_LABEL_SELECTOR;
const podNamespace = process.env.GAME_SERVER_POD_NAMESPACE;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

let activePodName: string;
let activePodStatus: string;

/**
 * Checks the status of the pod and saves it to the Game Server's database.
 */
(async function main() {
  try {
    console.log('Fetching container state...');

    const watch = new k8s.Watch(kc);
    watch.watch(
      `/api/v1/namespaces/${podNamespace}/pods`,
      { labelSelector: podLabelSelector },
      async (type, pod: k8s.V1Pod) => {
        console.log(type);
        console.log(JSON.stringify(pod));
        if (type === 'ADDED') {
          activePodName = pod.metadata.name;
        }

        if (activePodName !== pod.metadata.name || activePodStatus === pod.status.phase) {
          return;
        }

        activePodStatus = pod.status.phase;

        try {
          await updateGameServer(pod);
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

async function getPodIp(pod: k8s.V1Pod) {
  const response = await coreV1Api.readNode(pod.spec.nodeName);
  const address = response.body.status.addresses.find(a => a.type === 'ExternalIP');

  return address ? address.address : '127.0.0.1';
}

async function updateGameServer(pod: k8s.V1Pod) {
  let endpoints = null;
  if (pod.spec.nodeName) {
    const ip = await getPodIp(pod);
    const ports = pod.spec.containers.find(cs => cs.name === container).ports;
    const tcp = ports.find(p => p.protocol === 'TCP').hostPort;
    const udp = ports.find(p => p.protocol === 'UDP').hostPort;
    endpoints = {
      tcp: `tcp://${ip}:${tcp}`,
      udp: `udp://${ip}:${udp}`,
      websocket: `ws://${ip}:${tcp}`,
    };
  }

  const ownerReference = pod.metadata.ownerReferences[0];
  const isDeployment = ownerReference && ownerReference.kind === 'ReplicaSet';

  if (isDeployment || ['Pending', 'Running'].includes(pod.status.phase)) {
    console.log(`Updating Game Server status: ${pod.status.phase}.`);

    await requestPromiseNative.put({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: { endpoints, status: pod.status.phase },
      url: endpoint,
    });

    console.log('Game Server updated successfully.');
  } else {
    console.log(`Deleting Game Server...`);

    await requestPromiseNative.delete({
      headers: { Authorization: `Bearer ${accessToken}` },
      url: endpoint,
    });

    console.log('Game Server deleted successfully.');
  }
}
