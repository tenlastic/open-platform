import { V1Pod } from '@kubernetes/client-node';
import { nodeApiV1 } from '@tenlastic/kubernetes';

export async function getEndpoints(container: string, pod: V1Pod) {
  if (!pod || !pod.spec.nodeName) {
    return null;
  }

  const response = await nodeApiV1.read(pod.spec.nodeName);
  const address = response.body.status.addresses.find((a) => a.type === 'ExternalIP');
  const ip = address ? address.address : '127.0.0.1';

  const ports = pod.spec.containers.find((cs) => cs.name === container).ports;
  const tcp = ports.find((p) => p.protocol === 'TCP').hostPort;
  const udp = ports.find((p) => p.protocol === 'UDP').hostPort;

  return { tcp: `tcp://${ip}:${tcp}`, udp: `udp://${ip}:${udp}`, websocket: `ws://${ip}:${tcp}` };
}
