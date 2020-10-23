import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  CollectionMock,
  DatabaseDocument,
  DatabaseMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/collections/count', function() {
  let database: DatabaseDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['databases'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });
    database = await DatabaseMock.create({ namespaceId: namespace._id });

    await CollectionMock.create({ databaseId: database._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      params: { databaseName: database.name },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
