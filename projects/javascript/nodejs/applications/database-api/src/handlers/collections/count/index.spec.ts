import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  CollectionMock,
  DatabaseDocument,
  DatabaseMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

describe('handlers/collections/count', function() {
  let database: DatabaseDocument;
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
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
