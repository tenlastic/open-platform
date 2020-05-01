import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  ArticleMock,
  GameMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

describe('handlers/articles/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
    const game = await GameMock.create({ namespaceId: namespace._id });

    await ArticleMock.create({ gameId: game._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});