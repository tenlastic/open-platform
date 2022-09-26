import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { KubernetesNamespace, KubernetesNamespaceSidecar } from '../kubernetes';
import { NamespaceDocument } from '../mongodb';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();

// Delete Kubernetes resources.
NamespaceEvent.async(async (payload) => {
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
