import { NamespaceEvent } from '@tenlastic/mongoose-nats';

import { KubernetesNamespace } from '../kubernetes';

// Update Kubernetes resources.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesNamespace.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    (payload.operationType === 'update' && payload.updateDescription.updatedFields.limits)
  ) {
    await KubernetesNamespace.upsert(payload.fullDocument);
  }
});
