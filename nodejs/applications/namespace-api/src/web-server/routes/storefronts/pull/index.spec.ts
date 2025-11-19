import * as minio from '@tenlastic/minio';
import {
  AuthorizationModel,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceModel,
  StorefrontDocument,
  StorefrontModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as mongoose from 'mongoose';

import { MinioStorefront } from '../../../../minio';
import { handler, PullStorefrontContext } from './';

use(chaiAsPromised);

describe('web-server/storefronts/pull', function () {
  let _id: string;
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function () {
    _id = new mongoose.Types.ObjectId().toHexString();
    namespace = await NamespaceModel.mock().save();
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: PullStorefrontContext;
    let storefront: StorefrontDocument;

    beforeEach(async function () {
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.StorefrontsRead, AuthorizationRole.StorefrontsWrite],
        userId: user._id,
      }).save();
      storefront = await StorefrontModel.mock({ namespaceId: namespace._id }).save();

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

      ctx = ContextMock({
        params: {
          _id,
          field: 'images',
          storefrontId: storefront._id.toHexString(),
        },
        request: { host: 'localhost:3000', protocol: 'http' },
        state: { user: { _id: user._id.toHexString() } },
      });
    });

    it('updates the record', async function () {
      await handler(ctx);

      expect(ctx.response.body.record.images).to.eql([]);
    });

    it('removes the file from Minio', async function () {
      await handler(ctx);

      const promise = minio.statObject(
        process.env.MINIO_BUCKET,
        MinioStorefront.getObjectName(storefront.namespaceId, storefront._id, 'images', _id),
      );

      return expect(promise).to.be.rejected;
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const storefront = await StorefrontModel.mock({ namespaceId: namespace._id }).save();

      const ctx = ContextMock<PullStorefrontContext>({
        params: {
          _id,
          field: 'images',
          storefrontId: storefront._id.toHexString(),
        },
        state: { user: { _id: user._id.toHexString() } },
      });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
