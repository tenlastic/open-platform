import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  DatabaseMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/databases/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['databases'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });
    await DatabaseMock.create({ namespaceId: namespace._id });

    await DatabaseMock.create();
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
