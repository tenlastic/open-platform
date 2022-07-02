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
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from '.';

const chance = new Chance();
use(chaiAsExpected);

describe('routes/namespaces/update', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let record: NamespaceDocument;

    beforeEach(async function () {
      const userRole = await NamespaceUserMock.create({
        _id: user._id,
        roles: ['namespaces'],
      });
      record = await NamespaceMock.create({ users: [userRole] });
    });

    it('returns the updated record', async function () {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            name: chance.hash(),
            users: [],
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;

      const users = ctx.response.body.record.users[0];
      expect(users.roles).to.eql(['namespaces']);
      expect(users._id.toString()).to.eql(user._id.toString());
    });
  });

  context('when permission is denied', function () {
    let record: NamespaceDocument;

    beforeEach(async function () {
      record = await NamespaceMock.create();
    });

    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            name: chance.hash(),
          },
        },
        state: { user: { _id: new mongoose.Types.ObjectId() } },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
