import { Database, DatabaseDocument } from '@tenlastic/mongoose-models';

import { subscribe } from '../subscribe';
import { KubernetesDatabase, KubernetesDatabaseSidecar } from '../models';

export function databases() {
  return subscribe<DatabaseDocument>(Database, 'database', async payload => {
    if (payload.operationType === 'delete') {
      console.log(`Deleting Database: ${payload.fullDocument._id}.`);
      await KubernetesDatabase.delete(payload.fullDocument);

      console.log(`Deleting Database Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesDatabaseSidecar.delete(payload.fullDocument);
    } else if (
      payload.operationType === 'insert' ||
      Database.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
    ) {
      console.log(`Upserting Database: ${payload.fullDocument._id}.`);
      await KubernetesDatabase.delete(payload.fullDocument);
      await KubernetesDatabase.upsert(payload.fullDocument);

      console.log(`Upserting Database Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesDatabaseSidecar.upsert(payload.fullDocument);
    }
  });
}
