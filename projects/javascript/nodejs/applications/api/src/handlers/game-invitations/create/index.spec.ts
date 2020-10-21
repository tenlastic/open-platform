import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as mongoose from 'mongoose';

import {
  UserDocument,
  UserMock,
  NamespaceRolesMock,
  NamespaceMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/game-invitations/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    it('creates a new record', async function() {
      const namespaceRoles = NamespaceRolesMock.create({
        roles: ['Administrator'],
        userId: user._id,
      });
      const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });
      const ctx = new ContextMock({
        request: {
          body: {
            namespaceId: namespace._id,
            toUserId: mongoose.Types.ObjectId(),
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await NamespaceMock.create();
      const ctx = new ContextMock({
        request: {
          body: {
            namespaceId: namespace._id,
            toUserId: mongoose.Types.ObjectId(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
