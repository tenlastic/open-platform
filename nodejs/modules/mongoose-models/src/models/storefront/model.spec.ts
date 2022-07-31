import * as minio from '@tenlastic/minio';
import { expect } from 'chai';
import * as fs from 'fs';

import { StorefrontMock } from './model.mock';

describe('models/storefront/model', function () {
  describe('removeMinioImages()', function () {
    it('removes unused minio images', async function () {
      const storefront = await StorefrontMock.create();

      // Upload background image.
      const backgroundKey = storefront.getMinioKey('background');
      const backgroundStream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, backgroundKey, backgroundStream);

      // Upload image.
      const stream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, storefront.getMinioKey('images'), stream);

      await storefront.removeMinioImages();

      const objects = await minio.listObjects(process.env.MINIO_BUCKET, storefront.getMinioKey());
      expect(objects.length).to.eql(1);
      expect(objects[0].name).to.eql(backgroundKey);
    });
  });

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

  describe('removeMinioVideos()', function () {
    it('removes unused minio videos', async function () {
      const storefront = await StorefrontMock.create();

      // Upload background image.
      const backgroundKey = storefront.getMinioKey('background');
      const backgroundStream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, backgroundKey, backgroundStream);

      // Upload video.
      const stream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, storefront.getMinioKey('videos'), stream);

      await storefront.removeMinioVideos();

      const objects = await minio.listObjects(process.env.MINIO_BUCKET, storefront.getMinioKey());
      expect(objects.length).to.eql(1);
      expect(objects[0].name).to.eql(backgroundKey);
    });
  });
});
