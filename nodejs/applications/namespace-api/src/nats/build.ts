import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { KubernetesBuild, KubernetesBuildSidecar } from '../kubernetes';
import { Build, BuildDocument } from '../mongodb';
import { NamespaceEvent, NamespaceStorageLimitEvent } from './namespace';

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
      return Build.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Terminate Builds if Namespace storage limit is reached.
NamespaceStorageLimitEvent.async(async (namespace) => {
  const builds = await Build.find({
    $or: [{ 'status.finishedAt': { $exists: false } }, { 'status.finishedAt': null }],
    namespaceId: namespace._id,
  });
  const promises = builds.map((b) => KubernetesBuild.terminate(b));
  return Promise.all(promises);
});
