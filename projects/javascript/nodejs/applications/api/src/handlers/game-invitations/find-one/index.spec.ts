import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  GameMock,
  GameInvitationDocument,
  GameInvitationMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  UserRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/game-invitations/find-one', function() {
  let record: GameInvitationDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
    const game = await GameMock.create({ namespaceId: namespace._id });
    record = await GameInvitationMock.create({ gameId: game._id, toUserId: user._id });
  });

  context('when permission is granted', function() {
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

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const otherUser = await UserMock.create({});
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: otherUser.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
