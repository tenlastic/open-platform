import { nodeApiV1, podApiV1, V1Pod } from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const container = process.env.GAME_SERVER_CONTAINER;
const endpoint = process.env.GAME_SERVER_ENDPOINT;
const podLabelSelector = process.env.GAME_SERVER_POD_LABEL_SELECTOR;

const pods: { [key: string]: V1Pod } = {};

/**
 * Checks the status of the pod and saves it to the Game Server's database.
 */
export async function status() {
  podApiV1.watch(
    'dynamic',
    { labelSelector: podLabelSelector },
    async (type, pod: V1Pod) => {
      if (type === 'ADDED' || type === 'MODIFIED') {
        pods[pod.metadata.name] = pod;
      } else if (type === 'DELETED') {
        delete pods[pod.metadata.name];
      }

      try {
        await updateGameServer();
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
}

async function getPodIp(pod: V1Pod) {
  const response = await nodeApiV1.read(pod.spec.nodeName);
  const address = response.body.status.addresses.find(a => a.type === 'ExternalIP');

  return address ? address.address : '127.0.0.1';
}

function getPodStatus(pod: V1Pod) {
  const isReady =
    pod.status.conditions &&
    pod.status.conditions.find(c => c.status === 'True' && c.type === 'ContainersReady');

  let phase = pod.status.phase;
  if (phase === 'Running' && !isReady) {
    phase = 'Pending';
  }

  return { name: pod.metadata.name, phase };
}

async function updateGameServer() {
  // Endpoints.
  let endpoints = null;
  const pod = Object.values(pods).find(p => p.status.phase === 'Running');
  if (pod?.spec?.nodeName) {
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

  // Nodes.
  const nodes = Object.values(pods).map(getPodStatus);

  // Phase.
  let phase = 'Pending';
  if (nodes.every(n => n.phase === 'Running')) {
    phase = 'Running';
  } else if (nodes.some(n => n.phase === 'Error')) {
    phase = 'Error';
  } else if (nodes.some(n => n.phase === 'Failed')) {
    phase = 'Failed';
  }

  const ownerReference = pod.metadata.ownerReferences && pod.metadata.ownerReferences[0];
  const isDeployment = ownerReference && ownerReference.kind === 'ReplicaSet';

  if (isDeployment || ['Pending', 'Running'].includes(pod.status.phase)) {
    console.log(`Updating Game Server status: ${pod.status.phase}.`);

    await requestPromiseNative.put({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: { status: { endpoints, nodes, phase } },
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
