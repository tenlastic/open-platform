import * as minio from '@tenlastic/minio';
import {
  AuthorizationModel,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceLimitError,
  NamespaceLimitsModel,
  NamespaceModel,
  StorefrontDocument,
  StorefrontModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';

import { MinioStorefront } from '../../../../minio';
import { handler, UploadStorefrontContext } from './';

use(chaiAsPromised);

describe('web-server/storefronts/upload', function () {
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function () {
    namespace = await NamespaceModel.mock({
      limits: NamespaceLimitsModel.mock({ storage: 1 * 1000 * 1000 * 1000 }),
    }).save();
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: UploadStorefrontContext;
    let form: FormData;
    let storefront: StorefrontDocument;

    beforeEach(async function () {
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.StorefrontsRead, AuthorizationRole.StorefrontsWrite],
        userId: user._id,
      }).save();
      storefront = await StorefrontModel.mock({ namespaceId: namespace._id }).save();

      form = new FormData();

      ctx = ContextMock({
        params: {
          _id: storefront._id.toHexString(),
          field: 'background',
          namespaceId: namespace._id.toHexString(),
        },
        req: form as Readable as IncomingMessage,
        request: { headers: form.getHeaders(), host: 'localhost:3000', protocol: 'http' },
        state: { user: { _id: user._id.toHexString() } },
      });
    });

    it('creates a new record', async function () {
      form.append('example', 'example', { contentType: 'image/jpeg', filename: 'example.jpg' });

      await handler(ctx);

      const host = 'http://localhost:3000';
      expect(ctx.response.body.record.background).to.eql(
        `${host}/namespaces/${storefront.namespaceId}/storefronts/${storefront._id}/background`,
      );
    });

    it('uploads file to Minio', async function () {
      form.append('example', 'example', { contentType: 'image/jpeg', filename: 'example.jpg' });

      await handler(ctx);

      const result = await minio.statObject(
        process.env.MINIO_BUCKET,
        MinioStorefront.getObjectName(storefront.namespaceId, storefront._id, 'background'),
      );

      expect(result).to.exist;
    });

    it('does not allow invalid mimetypes', async function () {
      form.append('example', 'example', { contentType: 'image/x-icon', filename: 'example.ico' });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(
        'Mimetype must be: image/gif, image/jpeg, image/png.',
      );
    });

    it('does not allow large files', async function () {
      form.append('example', 'example', { contentType: 'image/jpeg', filename: 'example.jpg' });

      namespace.limits.storage = 1;
      await namespace.save();

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });

    it('does not allow more than one file', async function () {
      form.append('one', 'example', { contentType: 'image/jpeg', filename: 'example.jpg' });
      form.append('two', 'example', { contentType: 'image/jpeg', filename: 'example.jpg' });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith('Cannot upload more than one file at once.');
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const storefront = await StorefrontModel.mock({ namespaceId: namespace._id }).save();

      const ctx = ContextMock<UploadStorefrontContext>({
        params: {
          _id: storefront._id.toHexString(),
          field: 'background',
          namespaceId: namespace._id.toHexString(),
        },
        state: { user: { _id: user._id.toHexString() } },
      });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
