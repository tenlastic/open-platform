import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  GameInvitationDocument,
  GameInvitationMock,
  UserDocument,
  UserMock,
  NamespaceRolesMock,
  NamespaceMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/game-invitations/find', function() {
  let record: GameInvitationDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceRoles = NamespaceRolesMock.create({
      roles: ['Administrator'],
      userId: user._id,
    });
    const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });
    record = await GameInvitationMock.create({ namespaceId: namespace._id, toUserId: user._id });
    await GameInvitationMock.create();
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });
});
