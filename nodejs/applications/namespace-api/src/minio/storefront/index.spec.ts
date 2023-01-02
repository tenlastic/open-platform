import * as minio from '@tenlastic/minio';
import { StorefrontModel } from '@tenlastic/mongoose';
import { expect } from 'chai';
import * as fs from 'fs';

import { MinioStorefront } from './';

describe('minio/storefront', function () {
  describe('removeObjects()', function () {
    it('removes all Minio objects', async function () {
      const storefront = await StorefrontModel.mock().save();

      // Upload background image.
      const backgroundStream = fs.createReadStream(__filename);
      await minio.putObject(
        process.env.MINIO_BUCKET,
        MinioStorefront.getObjectName(storefront.namespaceId, storefront._id, 'background'),
        backgroundStream,
      );

      // Upload icon image.
      const iconStream = fs.createReadStream(__filename);
      await minio.putObject(
        process.env.MINIO_BUCKET,
        MinioStorefront.getObjectName(storefront.namespaceId, storefront._id, 'icon'),
        iconStream,
      );

      await MinioStorefront.removeObject(storefront);

      const objects = await minio.listObjects(
        process.env.MINIO_BUCKET,
        MinioStorefront.getObjectName(storefront.namespaceId, storefront._id),
      );
      expect(objects.length).to.eql(0);
    });
  });
});
