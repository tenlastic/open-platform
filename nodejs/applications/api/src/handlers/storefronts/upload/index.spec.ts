import * as minio from '@tenlastic/minio';
import {
  AuthorizationMock,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceLimitError,
  NamespaceLimitsMock,
  NamespaceMock,
  NamespaceStorefrontLimitsMock,
  StorefrontDocument,
  StorefrontMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';

import { handler } from './';

use(chaiAsPromised);

describe('handlers/storefronts/upload', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let ctx: ContextMock;
    let form: FormData;
    let storefront: StorefrontDocument;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          storefronts: NamespaceStorefrontLimitsMock.create({ size: 50 * 1000 * 1000 }),
        }),
      });
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.StorefrontsReadWrite],
        userId: user._id,
      });
      storefront = await StorefrontMock.create({ namespaceId: namespace._id });

      form = new FormData();
      form.append('valid', 'valid', { contentType: 'image/jpeg', filename: 'valid.jpg' });

      ctx = new ContextMock({
        params: { _id: storefront._id, field: 'background' },
        req: form,
        request: {
          headers: form.getHeaders(),
          host: 'localhost:3000',
          protocol: 'http',
        },
        state: { user },
      } as any);
    });

    it('creates a new record', async function () {
      await handler(ctx as any);

      expect(ctx.response.body.record.background).to.eql(
        `http://localhost:3000/storefronts/${storefront._id}/background`,
      );
    });

    it('uploads file to Minio', async function () {
      await handler(ctx as any);
      await new Promise((res) => setTimeout(res, 100));

      const result = await minio.statObject(
        process.env.MINIO_BUCKET,
        storefront.getMinioKey('background'),
      );

      expect(result).to.exist;
    });

    it('does not allow large files', async function () {
      namespace.limits.storefronts.size = 1;
      namespace.markModified('limits');
      await namespace.save();

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });

    it('does not allow invalid mimetypes', async function () {
      form.append('invalid', 'invalid', { contentType: 'image/x-icon', filename: 'invalid.ico' });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Mimetype must be: image/gif, image/jpeg, image/png.',
      );
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();
      const storefront = await StorefrontMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: { _id: storefront._id, field: 'background' },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});