import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  GameServerDocument,
  GameServerMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/game-servers/find', function() {
  let record: GameServerDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['game-servers'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

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
