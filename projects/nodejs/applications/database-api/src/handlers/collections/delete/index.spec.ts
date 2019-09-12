import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  CollectionDocument,
  CollectionMock,
  DatabaseMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/collections/delete', function() {
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();
  });

  context('when permission is granted', function() {
    let record: CollectionDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
      const database = await DatabaseMock.create({ namespaceId: namespace._id });
      record = await CollectionMock.create({ databaseId: database._id });
    });

    it('returns the deleted record', async function() {
      const ctx = new ContextMock({
        params: {
          databaseId: record.databaseId,
          id: record._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    let record: CollectionDocument;

    beforeEach(async function() {
      record = await CollectionMock.create();
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          databaseId: record.databaseId,
          id: record._id,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
