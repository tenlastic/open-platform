import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { KubernetesQueue, KubernetesQueueSidecar } from '../kubernetes';
import { Queue, QueueDocument } from '../mongodb';
import { NamespaceEvent } from './namespace';

export const QueueEvent = new EventEmitter<IDatabasePayload<QueueDocument>>();

// Delete Queues if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return Queue.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Kubernetes resources.
QueueEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesQueue.delete(payload.fullDocument);
    await KubernetesQueueSidecar.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    Queue.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    await KubernetesQueue.upsert(payload.fullDocument);
    await KubernetesQueueSidecar.upsert(payload.fullDocument);
  }
});
