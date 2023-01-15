import { NamespaceModel } from '@tenlastic/mongoose';
import { NamespaceEvent } from '@tenlastic/mongoose-nats';

import { KubernetesNamespace } from '../kubernetes';

// Update Kubernetes resources.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesNamespace.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    NamespaceModel.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    await KubernetesNamespace.upsert(payload.fullDocument);
  }
});
