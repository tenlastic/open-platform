import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsExpected from 'chai-as-promised';
import * as mongoose from 'mongoose';

import {
  NamespaceMock,
  NamespaceDocument,
  UserMock,
  UserDocument,
  NamespaceRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from '.';

use(chaiAsExpected);

describe('handlers/namespaces/delete', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let record: NamespaceDocument;

    beforeEach(async function() {
      const userRole = await NamespaceRolesMock.create({
        roles: ['Administrator'],
        userId: user._id,
      });
      record = await NamespaceMock.create({ accessControlList: [userRole] });
    });

    it('returns the deleted record', async function() {
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
