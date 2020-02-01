import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  IgnorationDocument,
  IgnorationMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
} from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/ignorations/delete', function() {
  let ignoration: IgnorationDocument;
  let fromUser: ReadonlyUserDocument;
  let toUser: ReadonlyUserDocument;

  beforeEach(async function() {
    fromUser = await ReadonlyUserMock.create();
    toUser = await ReadonlyUserMock.create();

    ignoration = await IgnorationMock.create({ fromUserId: fromUser._id, toUserId: toUser._id });
  });

  context('when permission is granted', function() {
    it('returns the deleted record', async function() {
      const ctx = new ContextMock({
        params: { _id: ignoration._id },
        state: { user: fromUser.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record.fromUserId.toString()).to.eql(fromUser._id.toString());
    });
  });

  context('when permission is denied', function() {
    it('returns a permission error', async function() {
      const ctx = new ContextMock({
        params: { _id: ignoration._id },
        state: { user: toUser.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Ignoration not found.');
    });
  });
});
