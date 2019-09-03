import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as Chance from 'chance';

import {
  ReadonlyNamespaceDocument,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

const chance = new Chance();

describe('handlers/databases/create', function() {
  let namespace: ReadonlyNamespaceDocument;
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
  });

  it('creates a new record', async function() {
    const ctx = new ContextMock({
      request: {
        body: {
          name: chance.hash(),
          namespaceId: namespace._id,
        },
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
