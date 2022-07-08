import {
  ArticleMock,
  ArticlePermissions,
  AuthorizationMock,
  AuthorizationRole,
  NamespaceMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { expect } from 'chai';

import { ContextMock } from '../../context';
import { count } from './';

describe('handlers/count', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();

    const namespace = await NamespaceMock.create();
    await AuthorizationMock.create({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.ArticlesRead],
      userId: user._id,
    });

    await ArticleMock.create({ namespaceId: namespace._id });
  });

  it('returns the number of matching records', async function () {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    const handler = count(ArticlePermissions);
    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
