import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from '.';

describe('handlers/namespaces/find', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
    await NamespaceMock.create();

    const userRole = await NamespaceUserMock.create({
      _id: user._id,
      roles: ['namespaces'],
    });
    await NamespaceMock.create({ users: [userRole] });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });
});
