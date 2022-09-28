import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { KubernetesNamespace, KubernetesNamespaceSidecar } from '../kubernetes';
import { NamespaceDocument } from '../mongodb';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();

// Update Kubernetes resources.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesNamespace.delete(payload.fullDocument);
    await KubernetesNamespaceSidecar.delete(payload.fullDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesNamespace.upsert(payload.fullDocument);
    await KubernetesNamespaceSidecar.upsert(payload.fullDocument);
  }
});
