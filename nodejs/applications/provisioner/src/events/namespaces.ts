import { Namespace, NamespaceDocument } from '@tenlastic/mongoose-models';

import { subscribe } from '../subscribe';
import { KubernetesNamespace, KubernetesNamespaceSidecar } from '../models';

export function namespaces() {
  return subscribe<NamespaceDocument>(Namespace, 'namespace', async (payload) => {
    if (payload.operationType === 'delete') {
      console.log(`Deleting Namespace: ${payload.fullDocument._id}.`);
      await KubernetesNamespace.delete(payload.fullDocument);

      console.log(`Deleting Namespace Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesNamespaceSidecar.delete(payload.fullDocument);
    } else if (payload.operationType === 'insert') {
      console.log(`Upserting Namespace: ${payload.fullDocument._id}.`);
      await KubernetesNamespace.upsert(payload.fullDocument);

      console.log(`Upserting Namespace Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesNamespaceSidecar.upsert(payload.fullDocument);
    }
  });
}
