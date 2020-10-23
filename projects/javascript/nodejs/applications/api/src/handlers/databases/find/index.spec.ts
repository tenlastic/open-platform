import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  DatabaseDocument,
  DatabaseMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/databases/find', function() {
  let record: DatabaseDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['databases'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });
    record = await DatabaseMock.create({ namespaceId: namespace._id });

    await DatabaseMock.create();
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
