import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  GameServerMock,
  LogMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/logs/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceRoles = NamespaceRolesMock.create({
      roles: ['Administrator'],
      userId: user._id,
    });
    const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });
    const gameServer = await GameServerMock.create({ namespaceId: namespace._id });
    await LogMock.create({ gameServerId: gameServer._id });
    await LogMock.create();
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
