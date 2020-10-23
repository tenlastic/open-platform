import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  GameInvitationMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/game-invitations/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['game-invitations'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

    await GameInvitationMock.create({ namespaceId: namespace._id, userId: user._id });
    await GameInvitationMock.create();
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
