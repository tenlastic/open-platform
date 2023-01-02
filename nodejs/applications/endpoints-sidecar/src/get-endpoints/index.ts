import { V1Pod } from '@kubernetes/client-node';
import { nodeApiV1 } from '@tenlastic/kubernetes';

export async function getEndpoints(containerName: string, pod: V1Pod) {
  if (!pod || !pod.spec.nodeName) {
    return null;
  }

  const response = await nodeApiV1.read(pod.spec.nodeName);
  const externalIp = response.body.status.addresses.find((a) => a.type === 'ExternalIP');
  const internalIp = response.body.status.addresses.find((a) => a.type === 'InternalIP');
  const container = pod.spec.containers.find((c) => c.name === containerName);

  return container.ports.map((p) => {
    return {
      externalIp: externalIp ? externalIp.address : '127.0.0.1',
      externalPort: p.hostPort,
      internalIp: internalIp ? internalIp.address : '127.0.0.1',
      internalPort: p.containerPort,
      protocol: p.protocol,
    };
  });
}
