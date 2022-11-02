import * as minio from '@tenlastic/minio';
import { expect } from 'chai';
import * as fs from 'fs';

import { StorefrontMock } from './model.mock';

describe('mongodb/models/storefront/model', function () {
  describe('removeMinioObjects()', function () {
    it('removes all minio objects', async function () {
      const storefront = await StorefrontMock.create();

      // Upload background image.
      const backgroundStream = fs.createReadStream(__filename);
      await minio.putObject(
        process.env.MINIO_BUCKET,
        storefront.getMinioKey('background'),
        backgroundStream,
      );

      // Upload icon image.
      const iconStream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, storefront.getMinioKey('icon'), iconStream);

      await storefront.removeMinioObjects();

      const objects = await minio.listObjects(process.env.MINIO_BUCKET, storefront.getMinioKey());
      expect(objects.length).to.eql(0);
    });
  });
});
