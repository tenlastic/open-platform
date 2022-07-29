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
import * as Chance from 'chance';
import * as FormData from 'form-data';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/storefronts/videos/upload', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let ctx: ContextMock;
    let form: FormData;
    let namespace: NamespaceDocument;
    let storefront: StorefrontDocument;

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
      form.append('valid', 'valid', { contentType: 'video/mp4', filename: 'valid.mp4' });

      ctx = new ContextMock({
        params: { _id: storefront._id },
        req: form,
        request: {
          headers: form.getHeaders(),
          host: 'localhost:3000',
          protocol: 'http',
        },
        state: { user },
      } as any);
    });

    it('updates the record', async function () {
      await handler(ctx as any);

      const { videos } = ctx.response.body.record;
      expect(videos[0]).to.include(`http://localhost:3000/storefronts/${storefront._id}/videos`);
    });

    it('uploads file to Minio', async function () {
      await handler(ctx as any);
      await new Promise((res) => setTimeout(res, 100));

      const { videos } = ctx.response.body.record;
      const _id = videos[0].replace(
        `http://localhost:3000/storefronts/${storefront._id}/videos/`,
        '',
      );
      const result = await minio.statObject(
        process.env.MINIO_BUCKET,
        storefront.getMinioKey('videos', _id),
      );

      expect(result).to.exist;
    });

    it('does not allow large files', async function () {
      namespace.limits.storefronts.size = 1;
      namespace.markModified('limits');
      await namespace.save();

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: storefronts.size. Value: 1.',
      );
    });

    it('does not allow invalid mimetypes', async function () {
      form.append('invalid', 'invalid', { contentType: 'video/x-icon', filename: 'invalid.ico' });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Mimetype must be: video/mp4.');
    });

    it('does not allow too many videos', async function () {
      storefront.videos.push(chance.hash());
      await storefront.save();

      namespace.limits.storefronts.videos = 1;
      namespace.markModified('limits');
      await namespace.save();

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();
      const storefront = await StorefrontMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: { _id: storefront._id },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
