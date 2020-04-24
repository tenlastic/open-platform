import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { RefreshTokenDocument, RefreshTokenMock, UserDocument, UserMock } from '../../../models';
import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/refresh-tokens/update', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let record: RefreshTokenDocument;

    beforeEach(async function() {
      record = await RefreshTokenMock.create({ userId: user._id });
    });

    it('returns the record', async function() {
      const ctx = new ContextMock({
        params: {
          jti: record.jti,
        },
        request: {
          body: {
            expiresAt: chance.date(),
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    let record: RefreshTokenDocument;

    beforeEach(async function() {
      record = await RefreshTokenMock.create();
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            expiresAt: chance.date(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
