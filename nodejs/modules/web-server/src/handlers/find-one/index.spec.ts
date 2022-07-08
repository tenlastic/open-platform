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
import { findOne } from './';

use(chaiAsPromised);

describe('handlers/find-one', function () {
  let record: ArticleDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();

    const namespace = await NamespaceMock.create();
    await AuthorizationMock.create({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.ArticlesRead],
      userId: user._id,
    });

    record = await ArticleMock.create({ namespaceId: namespace._id });
  });

  it('returns the record', async function () {
    const ctx = new ContextMock({
      params: {
        _id: record._id,
      },
      state: { user: user.toObject() },
    });

    const handler = findOne(ArticlePermissions);
    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
