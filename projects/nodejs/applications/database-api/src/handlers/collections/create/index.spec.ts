import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as Chance from 'chance';

import {
  DatabaseDocument,
  DatabaseMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

const chance = new Chance();

describe('handlers/collections/create', function() {
  let database: DatabaseDocument;
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
    database = await DatabaseMock.create({ namespaceId: namespace._id });
  });

  it('creates a new record', async function() {
    const ctx = new ContextMock({
      request: {
        body: {
          databaseId: database._id,
          name: chance.hash(),
        },
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
