import { Queue, QueueDocument } from '@tenlastic/mongoose-models';

import { subscribe } from '../subscribe';
import { KubernetesQueue, KubernetesQueueSidecar } from '../models';

export function queues() {
  return subscribe<QueueDocument>(Queue, 'queue', async payload => {
    if (payload.operationType === 'delete') {
      console.log(`Deleting Queue: ${payload.fullDocument._id}.`);
      await KubernetesQueue.delete(payload.fullDocument);

      console.log(`Deleting Queue Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesQueueSidecar.delete(payload.fullDocument);
    } else if (
      payload.operationType === 'insert' ||
      Queue.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
    ) {
      console.log(`Upserting Queue: ${payload.fullDocument._id}.`);
      await KubernetesQueue.delete(payload.fullDocument);
      await KubernetesQueue.upsert(payload.fullDocument);

      console.log(`Upserting Queue Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesQueueSidecar.upsert(payload.fullDocument);
    }
  });
}
