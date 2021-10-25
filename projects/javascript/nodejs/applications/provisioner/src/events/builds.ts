import { Build, BuildDocument } from '@tenlastic/mongoose-models';

import { subscribe } from '../subscribe';
import { KubernetesBuild, KubernetesBuildSidecar } from '../models';

export function builds() {
  return subscribe<BuildDocument>(Build, 'build', async payload => {
    if (payload.operationType === 'delete') {
      console.log(`Deleting Build: ${payload.fullDocument._id}.`);
      await KubernetesBuild.delete(payload.fullDocument);
    } else if (payload.operationType === 'insert') {
      console.log(`Creating Build: ${payload.fullDocument._id}.`);
      await KubernetesBuild.upsert(payload.fullDocument);

      console.log(`Creating Build Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesBuildSidecar.upsert(payload.fullDocument);
    } else if (payload.operationType === 'update' && payload.fullDocument.status?.finishedAt) {
      console.log(`Deleting Build Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesBuildSidecar.delete(payload.fullDocument);
    }
  });
}
