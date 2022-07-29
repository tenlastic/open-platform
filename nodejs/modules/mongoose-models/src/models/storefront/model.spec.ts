import * as minio from '@tenlastic/minio';
import { expect } from 'chai';
import * as fs from 'fs';

import { NamespaceLimitsMock, NamespaceMock, NamespaceStorefrontLimitsMock } from '../namespace';
import { StorefrontMock } from './model.mock';
import { Storefront, StorefrontAccess } from './model';

describe('models/storefront/model', function () {
  describe('checkNamespaceLimits()', function () {
    it('enforces the storefronts.count Namespace limit', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          storefronts: NamespaceStorefrontLimitsMock.create({ count: 1 }),
        }),
      });
      await StorefrontMock.create({ namespaceId: namespace._id });

      const promise = Storefront.checkNamespaceLimits(
        null,
        StorefrontAccess.Private,
        namespace._id,
      );

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: storefronts.count. Value: 1.',
      );
    });

    it('enforces the storefronts.public Namespace limit', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          storefronts: NamespaceStorefrontLimitsMock.create({ public: 0 }),
        }),
      });

      const promise = Storefront.checkNamespaceLimits(null, StorefrontAccess.Public, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: storefronts.public. Value: 0.',
      );
    });
  });

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
