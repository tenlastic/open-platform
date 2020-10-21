import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  CollectionDocument,
  CollectionMock,
  DatabaseDocument,
  DatabaseMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/collections/find', function() {
  let database: DatabaseDocument;
  let record: CollectionDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceRoles = NamespaceRolesMock.create({
      roles: ['Administrator'],
      userId: user._id,
    });
    const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });
    database = await DatabaseMock.create({ namespaceId: namespace._id });
    record = await CollectionMock.create({ databaseId: database._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      params: { databaseName: database.name },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });
});
