import { EventEmitter, IDatabasePayload, NamespaceDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace, KubernetesNamespaceSidecar } from '../kubernetes';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();

// Update Kubernetes resources.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesNamespace.delete(payload.fullDocument);
    await KubernetesNamespaceSidecar.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    payload.updateDescription?.updatedFields.limits
  ) {
    await KubernetesNamespace.upsert(payload.fullDocument);
    await KubernetesNamespaceSidecar.upsert(payload.fullDocument);
  }
});
