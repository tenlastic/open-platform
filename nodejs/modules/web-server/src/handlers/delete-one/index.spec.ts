import {
  ArticleDocument,
  ArticleMock,
  ArticlePermissions,
  AuthorizationMock,
  AuthorizationRole,
  NamespaceMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { ContextMock } from '../../context';
import { deleteOne } from './';

use(chaiAsPromised);

describe('handlers/delete-one', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let record: ArticleDocument;

    beforeEach(async function () {
      const namespace = await NamespaceMock.create();
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.ArticlesReadWrite],
        userId: user._id,
      });

      record = await ArticleMock.create({ namespaceId: namespace._id });
    });

    it('returns the deleted record', async function () {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: user.toObject() },
      });

      const handler = deleteOne(ArticlePermissions);
      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function () {
    let record: ArticleDocument;

    beforeEach(async function () {
      const namespace = await NamespaceMock.create();
      record = await ArticleMock.create({ namespaceId: namespace._id });
    });

    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: user.toObject() },
      });

      const handler = deleteOne(ArticlePermissions);
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
