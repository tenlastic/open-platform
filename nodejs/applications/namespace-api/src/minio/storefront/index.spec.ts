import * as minio from '@tenlastic/minio';
import { expect } from 'chai';
import * as fs from 'fs';

import { Storefront } from '../../mongodb';
import { MinioStorefront } from './';

describe('mongodb/models/storefront', function () {
  describe('removeObjects()', function () {
    it('removes all Minio objects', async function () {
      const storefront = await Storefront.mock().save();

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
