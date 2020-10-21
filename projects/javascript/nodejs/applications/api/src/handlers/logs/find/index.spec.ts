import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  GameServerMock,
  LogDocument,
  LogMock,
  UserDocument,
  UserMock,
  NamespaceRolesMock,
  NamespaceMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/logs/find', function() {
  let record: LogDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceRoles = NamespaceRolesMock.create({
      roles: ['Administrator'],
      userId: user._id,
    });
    const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });
    const gameServer = await GameServerMock.create({ namespaceId: namespace._id });
    record = await LogMock.create({ gameServerId: gameServer._id });
    await LogMock.create();
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
