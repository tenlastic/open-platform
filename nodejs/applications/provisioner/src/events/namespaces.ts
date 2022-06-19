import { Namespace, NamespaceDocument } from '@tenlastic/mongoose-models';

import { subscribe } from '../subscribe';
import { KubernetesNamespace } from '../models';

export function namespaces() {
  return subscribe<NamespaceDocument>(Namespace, 'namespace', async payload => {
    if (payload.operationType === 'delete') {
      console.log(`Deleting Namespace: ${payload.fullDocument._id}.`);
      await KubernetesNamespace.delete(payload.fullDocument);
    } else {
      console.log(`Upserting Namespace: ${payload.fullDocument._id}.`);
      await KubernetesNamespace.upsert(payload.fullDocument);
    }
  });
}
