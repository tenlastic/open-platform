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
import { expect } from 'chai';

import { ContextMock } from '../../context';
import { find } from './';

describe('handlers/find', function () {
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

  it('returns the number of matching records', async function () {
    const ctx = new ContextMock({
      state: { user },
    });

    const handler = find(ArticlePermissions);
    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });
});
