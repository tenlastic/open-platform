import { endpointsApiV1, networkPolicyApiV1, serviceApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace } from './';

export const KubernetesNamespaceNetworkPolicy = {
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNamespace.getName(namespace._id);

    // Get the Kubernetes API IP addresses.
    const endpoints = await endpointsApiV1.list('default', {});
    const endpoint = endpoints.body.items.find((i) => i.metadata.name === 'kubernetes');
    const endpointIp = endpoint.subsets[0].addresses[0].ip;
    const services = await serviceApiV1.list('default', {});
    const service = services.body.items.find((i) => i.metadata.name === 'kubernetes');
    const serviceIP = service.spec.clusterIP;

    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        egress: [
          {
            to: [
              {
                namespaceSelector: { matchLabels: { name: 'static' } },
                podSelector: { matchLabels: { 'app.kubernetes.io/name': 'mongodb' } },
              },
              {
                namespaceSelector: { matchLabels: { name: 'static' } },
                podSelector: { matchLabels: { 'app.kubernetes.io/name': 'nats' } },
              },
              {
                namespaceSelector: { matchLabels: { name: 'static' } },
                podSelector: { matchLabels: { 'app.kubernetes.io/name': 'redis' } },
              },
              { podSelector: { matchLabels: { 'tenlastic.com/app': name } } },
            ],
          },
        ],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });

    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name: `${name}-kubernetes-api` },
      spec: {
        egress: [
          {
            to: [
              { ipBlock: { cidr: `${endpointIp}/32` } },
              { ipBlock: { cidr: `${serviceIP}/32` } },
            ],
          },
        ],
        podSelector: { matchLabels: { 'tenlastic.com/namespaceId': `${namespace._id}` } },
        policyTypes: ['Egress'],
      },
    });
  },
};
