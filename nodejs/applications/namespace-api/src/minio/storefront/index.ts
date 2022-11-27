import * as minio from '@tenlastic/minio';
import * as mongoose from 'mongoose';

import { StorefrontDocument } from '../../mongodb';

export const MinioStorefront = {
  /**
   * Get the object name of the property within Minio.
   */
  getObjectName(
    namespaceId: mongoose.Types.ObjectId | string,
    storefrontId: mongoose.Types.ObjectId | string,
    field?: string,
    _id?: string,
  ) {
    const id = _id || new mongoose.Types.ObjectId();

    switch (field) {
      case 'background':
        return `namespaces/${namespaceId}/storefronts/${storefrontId}/background`;

      case 'icon':
        return `namespaces/${namespaceId}/storefronts/${storefrontId}/icon`;

      case 'images':
        return `namespaces/${namespaceId}/storefronts/${storefrontId}/images/${id}`;

      case 'logo':
        return `namespaces/${namespaceId}/storefronts/${storefrontId}/logo`;

      case 'videos':
        return `namespaces/${namespaceId}/storefronts/${storefrontId}/videos/${id}`;

      default:
        return `namespaces/${namespaceId}/storefronts/${storefrontId}`;
    }
  },

  /**
   * Get the URL of the object within Minio.
   */
  getUrl(host: string, objectName: string, protocol: string) {
    const base = `${protocol}://${host}`;
    return `${base}/${objectName}`;
  },

  /**
   * Removes all objects from Minio.
   */
  async removeObject(storefront: StorefrontDocument) {
    const prefix = MinioStorefront.getObjectName(storefront.namespaceId, storefront._id);
    const objects = await minio.listObjects(process.env.MINIO_BUCKET, prefix);

    const promises = objects.map((o) => minio.removeObject(process.env.MINIO_BUCKET, o.name));
    return Promise.all(promises);
  },
};
