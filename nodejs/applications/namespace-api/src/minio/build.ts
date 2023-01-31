import * as minio from '@tenlastic/minio';
import { BuildDocument } from '@tenlastic/mongoose';
import axios from 'axios';

export const MinioBuild = {
  /**
   * Gets the object name of the file within Minio.
   */
  getFileObjectName(build: BuildDocument, path: string) {
    return `namespaces/${build.namespaceId}/builds/${build._id}/${path}`;
  },

  /**
   * Gets the object name of the zip file within Minio.
   */
  getZipObjectName(build: BuildDocument) {
    return `namespaces/${build.namespaceId}/builds/${build._id}/archive.zip`;
  },

  /**
   * Deletes all objects from Minio.
   */
  async removeObjects(build: BuildDocument) {
    // Delete zip file.
    const zipPath = MinioBuild.getZipObjectName(build);
    await minio.removeObject(process.env.MINIO_BUCKET, zipPath);

    // Delete build files.
    for (const file of build.files) {
      const objectName = MinioBuild.getFileObjectName(build, file.path);
      await minio.removeObject(process.env.MINIO_BUCKET, objectName);
    }

    try {
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
    } catch (e) {
      if (e.response.status === 404) {
        return;
      }

      throw e;
    }
  },
};
