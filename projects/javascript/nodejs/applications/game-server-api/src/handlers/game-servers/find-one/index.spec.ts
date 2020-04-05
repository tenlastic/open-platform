import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  GameServerDocument,
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
  GameServerMock,
} from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/game-servers/find-one', function() {
  let record: GameServerDocument;
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
    const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });
    record = await GameServerMock.create({ gameId: game._id });
  });

  it('returns the record', async function() {
    const ctx = new ContextMock({
      params: {
        _id: record._id,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
