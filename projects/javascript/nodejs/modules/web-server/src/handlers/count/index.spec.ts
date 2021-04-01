import {
  ArticleMock,
  ArticlePermissions,
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { expect } from 'chai';

import { ContextMock } from '../../context';
import { count } from './';

describe('defaults/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['articles'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

    await ArticleMock.create({ namespaceId: namespace._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    const handler = count(ArticlePermissions);
    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
