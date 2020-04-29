import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as Chance from 'chance';
import * as chaiAsExpected from 'chai-as-promised';
import * as mongoose from 'mongoose';

import {
  NamespaceMock,
  NamespaceDocument,
  UserMock,
  UserDocument,
  UserRolesMock,
} from '../../../models';
import { handler } from '.';

const chance = new Chance();
use(chaiAsExpected);

describe('handlers/namespaces/update', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let record: NamespaceDocument;

    beforeEach(async function() {
      const userRole = await UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      record = await NamespaceMock.create({ accessControlList: [userRole] });
    });

    it('returns the updated record', async function() {
      const ctx = new ContextMock({
        params: {
          id: record._id,
        },
        request: {
          body: {
            accessControlList: [],
            name: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;

      const accessControlList = ctx.response.body.record.accessControlList[0];
      expect(accessControlList.roles).to.eql(['Administrator']);
      expect(accessControlList.userId.toString()).to.eql(user._id.toString());
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
        request: {
          body: {
            name: chance.hash(),
          },
        },
        state: { user: { _id: mongoose.Types.ObjectId() } },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
