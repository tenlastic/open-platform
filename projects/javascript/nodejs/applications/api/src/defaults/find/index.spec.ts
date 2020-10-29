import {
  ArticleDocument,
  ArticleMock,
  ArticlePermissions,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { find } from './';

describe('defaults/find', function() {
  let record: ArticleDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['articles'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

    record = await ArticleMock.create({ namespaceId: namespace._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    const handler = find(ArticlePermissions);
    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });
});
