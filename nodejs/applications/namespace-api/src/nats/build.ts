import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { KubernetesBuild, KubernetesBuildSidecar } from '../kubernetes';
import { Build, BuildDocument } from '../mongodb';
import { NamespaceEvent } from './namespace';

export const BuildEvent = new EventEmitter<IDatabasePayload<BuildDocument>>();

// Delete files from Minio if associated Build is deleted.
BuildEvent.async(async (payload) => {
  if (payload.operationType !== 'delete') {
    return;
  }

  // Delete Minio files.
  await payload.fullDocument.deleteMinioFiles();
});

// Delete Kubernetes resources.
BuildEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesBuild.delete(payload.fullDocument, payload.operationType);
    await KubernetesBuildSidecar.delete(payload.fullDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesBuild.upsert(payload.fullDocument);
    await KubernetesBuildSidecar.upsert(payload.fullDocument);
  } else if (payload.operationType === 'update' && payload.fullDocument.status?.finishedAt) {
    await KubernetesBuild.delete(payload.fullDocument);
    await KubernetesBuildSidecar.delete(payload.fullDocument);
  }
});

// Delete Builds if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Build.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
