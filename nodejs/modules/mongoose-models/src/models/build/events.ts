import * as minio from '@tenlastic/minio';
import axios from 'axios';

import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnNamespaceConsumed } from '../namespace';
import { Build, BuildDocument } from './model';

export const OnBuildConsumed = new EventEmitter<IDatabasePayload<BuildDocument>>();

// Delete files from Minio if associated Build is deleted.
OnBuildConsumed.async(async (payload) => {
  if (payload.operationType !== 'delete') {
    return;
  }

  // Delete zip file.
  const build = payload.fullDocument;
  const zipPath = build.getZipPath();
  await minio.removeObject(process.env.MINIO_BUCKET, zipPath);

  // Delete build files.
  for (const file of build.files) {
    const path = build.getFilePath(file.path);
    await minio.removeObject(process.env.MINIO_BUCKET, path);
  }

  // Delete docker tag.
  const headers = { Accept: 'application/vnd.docker.distribution.manifest.v2+json' };
  const url = process.env.DOCKER_REGISTRY_URL;

  const response = await axios({
    headers,
    method: 'GET',
    url: `${url}/v2/${build.namespaceId}/manifests/${build._id}`,
  });

  const digest = response.headers['docker-content-digest'];
  await axios({
    headers,
    method: 'DELETE',
    url: `${url}/v2/${build.namespaceId}/manifests/${digest}`,
  });
});

// Delete Builds if associated Namespace is deleted.
OnNamespaceConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Build.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
