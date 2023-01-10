import { ingressApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace } from './';

export const KubernetesNamespaceIngress = {
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNamespace.getName(namespace._id);

    const ingress = await ingressApiV1.read('default', 'static');
    await ingressApiV1.createOrReplace('dynamic', {
      metadata: { annotations: ingress.body.metadata.annotations, labels: { ...labels }, name },
      spec: {
        rules: [
          {
            host: ingress.body.spec.rules.find((r) => r.host.startsWith('api')).host,
            http: {
              paths: [
                getPath(namespace, '/articles'),
                getPath(namespace, '/builds'),
                getPath(namespace, '/collections'),
                getPath(namespace, '/game-server-templates'),
                getPath(namespace, '/game-servers'),
                getPath(namespace, '/match-invitations'),
                getPath(namespace, '/matches'),
                getPath(namespace, '/queue-members'),
                getPath(namespace, '/queues'),
                getPath(namespace, '/storefronts'),
                getPath(namespace, '/web-sockets'),
                getPath(namespace, '/workflows'),
              ],
            },
          },
          {
            host: ingress.body.spec.rules.find((r) => r.host.startsWith('wss')).host,
            http: {
              paths: [
                {
                  backend: { service: { name: `${name}-api`, port: { number: 3000 } } },
                  path: `/namespaces/${namespace._id}`,
                  pathType: 'Prefix',
                },
              ],
            },
          },
        ],
        tls: ingress.body.spec.tls ? ingress.body.spec.tls.map((t) => ({ hosts: t.hosts })) : null,
      },
    });
  },
};

function getPath(namespace: NamespaceDocument, path: string) {
  const name = KubernetesNamespace.getName(namespace._id);
  const prefix = `/namespaces/${namespace._id}`;

  return {
    backend: { service: { name: `${name}-api`, port: { number: 3000 } } },
    path: prefix + path,
    pathType: 'Prefix',
  };
}
