import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  ArticleMock,
  GameDocument,
  GameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

describe('handlers/articles/count', function() {
  let game: GameDocument;
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
    game = await GameMock.create({ namespaceId: namespace._id });

    await ArticleMock.create({ gameId: game._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      params: { gameSlug: game.slug },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});