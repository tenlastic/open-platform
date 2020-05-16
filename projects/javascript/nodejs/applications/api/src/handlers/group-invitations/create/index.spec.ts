import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as mongoose from 'mongoose';

import { UserDocument, UserMock, GroupMock } from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/group-invitations/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    it('creates a new record', async function() {
      const group = await GroupMock.create({ userIds: [user._id] });
      const ctx = new ContextMock({
        request: {
          body: {
            groupId: group._id,
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
      const group = await GroupMock.create({ userIds: [mongoose.Types.ObjectId()] });
      const ctx = new ContextMock({
        request: {
          body: {
            groupId: group._id,
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
