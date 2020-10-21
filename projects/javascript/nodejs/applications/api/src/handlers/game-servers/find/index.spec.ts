import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  GameServerDocument,
  GameServerMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/game-servers/find', function() {
  let record: GameServerDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceRoles = NamespaceRolesMock.create({
      roles: ['Administrator'],
      userId: user._id,
    });
    const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });

    record = await GameServerMock.create({ namespaceId: namespace._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
  });
});
