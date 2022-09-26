import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { KubernetesQueue, KubernetesQueueSidecar } from '../kubernetes';
import { Queue, QueueDocument } from '../mongodb';
import { NamespaceEvent } from './namespace';

export const QueueEvent = new EventEmitter<IDatabasePayload<QueueDocument>>();

// Delete Queues if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Queue.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
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
