import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  CollectionDocument,
  CollectionMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/collections/find', function() {
  let record: CollectionDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['collections'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });
    record = await CollectionMock.create({ namespaceId: namespace._id });
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
