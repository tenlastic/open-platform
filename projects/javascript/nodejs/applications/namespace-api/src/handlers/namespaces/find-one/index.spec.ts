import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as mongoose from 'mongoose';

import {
  NamespaceDocument,
  NamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from '.';

describe('handlers/namespaces/find-one', function() {
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();
  });

  context('when permission is granted', function() {
    let record: NamespaceDocument;

    beforeEach(async function() {
      const userRole = await UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      record = await NamespaceMock.create({ accessControlList: [userRole] });
    });

    it('returns the record', async function() {
      const ctx = new ContextMock({
        params: {
          id: record._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    let record: NamespaceDocument;

    beforeEach(async function() {
      record = await NamespaceMock.create();
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          id: record._id,
        },
        state: { user: { _id: mongoose.Types.ObjectId() } },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
