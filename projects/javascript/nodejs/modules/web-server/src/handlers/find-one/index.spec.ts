import {
  ArticleDocument,
  ArticleMock,
  ArticlePermissions,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { ContextMock } from '../../context';
import { findOne } from './';

use(chaiAsPromised);

describe('defaults/find-one', function() {
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

  it('returns the record', async function() {
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
