import { secretApiV1 } from '@tenlastic/kubernetes';
import { AuthorizationDocument, NamespaceDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace } from './';

export const KubernetesNamespaceSecrets = {
  upsert: async (authorizations: AuthorizationDocument[], namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNamespace.getName(namespace._id);

    return Promise.all([
      secretApiV1.createOrReplace('dynamic', {
        metadata: { labels: { ...labels }, name },
        stringData: {
          MINIO_BUCKET: name,
          MONGO_DATABASE_NAME: name,
        },
      }),

      secretApiV1.createOrReplace('dynamic', {
        metadata: { labels: { ...labels }, name: `${name}-api-keys` },
        stringData: {
          BUILDS: authorizations[0].apiKey,
          GAME_SERVERS: authorizations[1].apiKey,
          NAMESPACES: authorizations[2].apiKey,
          QUEUES: authorizations[3].apiKey,
          WORKFLOWS: authorizations[4].apiKey,
        },
      }),
    ]);
  },
};
