import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  GameInvitationDocument,
  GameInvitationMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
  NamespaceMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/game-invitations/delete', function() {
  let otherUser: UserDocument;
  let user: UserDocument;

  beforeEach(async function() {
    otherUser = await UserMock.create();
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let record: GameInvitationDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-invitations'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      record = await GameInvitationMock.create({
        namespaceId: namespace._id,
        userId: otherUser._id,
      });
    });

    it('returns the deleted record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: otherUser.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    let record: GameInvitationDocument;

    beforeEach(async function() {
      const namespace = await NamespaceMock.create();
      record = await GameInvitationMock.create({ namespaceId: namespace._id, userId: user._id });
    });

    it('throws an error', async function() {
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
