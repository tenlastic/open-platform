import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  ArticleDocument,
  ArticleMock,
  GameDocument,
  GameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/articles/find-one', function() {
  let game: GameDocument;
  let record: ArticleDocument;
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });

    game = await GameMock.create({ namespaceId: namespace._id });
    record = await ArticleMock.create({ gameId: game._id });
  });

  it('returns the record', async function() {
    const ctx = new ContextMock({
      params: {
        _id: record._id,
        gameSlug: game.slug,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
