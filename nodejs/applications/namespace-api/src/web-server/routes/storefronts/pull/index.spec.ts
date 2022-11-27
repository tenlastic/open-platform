import * as minio from '@tenlastic/minio';
import { AuthorizationRole } from '@tenlastic/mongoose';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as mongoose from 'mongoose';

import { MinioStorefront } from '../../../../minio';
import {
  Authorization,
  Namespace,
  NamespaceDocument,
  Storefront,
  StorefrontDocument,
  User,
  UserDocument,
} from '../../../../mongodb';
import { handler } from './';

use(chaiAsPromised);

describe('web-server/storefronts/pull', function () {
  let _id: string;
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function () {
    _id = new mongoose.Types.ObjectId().toString();
    namespace = await Namespace.mock().save();
    user = await User.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: ContextMock;
    let storefront: StorefrontDocument;

    beforeEach(async function () {
      await Authorization.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.StorefrontsReadWrite],
        userId: user._id,
      }).save();
      storefront = await Storefront.mock({ namespaceId: namespace._id }).save();

      // Upload test file to Minio.
      const objectName = MinioStorefront.getObjectName(
        storefront.namespaceId,
        storefront._id,
        'images',
        _id,
      );
      await minio.putObject(process.env.MINIO_BUCKET, objectName, fs.createReadStream(__filename));

      // Add the image to the Storefront.
      const host = 'localhost:3000';
      const protocol = 'http';
      const url = MinioStorefront.getUrl(host, objectName, protocol);
      storefront.images = [url];
      await storefront.save();

      ctx = new ContextMock({
        params: {
          _id,
          field: 'images',
          namespaceId: namespace._id,
          storefrontId: storefront._id,
        },
        request: { host: 'localhost:3000', protocol: 'http' },
        state: { user },
      } as any);
    });

    it('updates the record', async function () {
      await handler(ctx as any);

      expect(ctx.response.body.record.images).to.eql([]);
    });

    it('removes the file from Minio', async function () {
      await handler(ctx as any);

      const promise = minio.statObject(
        process.env.MINIO_BUCKET,
        MinioStorefront.getObjectName(storefront.namespaceId, storefront._id, 'images', _id),
      );

      return expect(promise).to.be.rejected;
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const storefront = await Storefront.mock({ namespaceId: namespace._id }).save();

      const ctx = new ContextMock({
        params: {
          _id,
          field: 'images',
          namespaceId: namespace._id,
          storefrontId: storefront._id,
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
