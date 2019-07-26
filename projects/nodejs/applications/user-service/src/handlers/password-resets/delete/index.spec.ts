import { ContextMock } from '@tenlastic/api-module';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import {
  PasswordResetDocument,
  PasswordResetMock,
  RefreshToken,
  RefreshTokenMock,
  UserDocument,
  UserMock,
  User,
} from '../../../models';
import { handler } from '.';
import { Context } from 'koa';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/password-resets/delete', function() {
  let record: PasswordResetDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
    record = await PasswordResetMock.create({ userId: user._id });
  });

  context('when password is not provided', function() {
    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          hash: record.hash,
        },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Missing required parameters: password.');
    });
  });

  context('when password is provided', function() {
    context('when hash is invalid', function() {
      it('returns a 200 status code', async function() {
        const ctx = new ContextMock({
          params: {
            hash: chance.hash({ length: 128 }),
          },
          request: {
            body: {
              password: chance.hash(),
            },
          },
        });

        const promise = handler(ctx as any);

        return expect(promise).to.be.rejectedWith('Something went wrong. Please try again.');
      });
    });

    context('when hash is valid', function() {
      let ctx: Context;
      let previousPassword: string;

      beforeEach(async function() {
        ctx = new ContextMock({
          params: {
            hash: record.hash,
          },
          request: {
            body: {
              password: chance.hash(),
            },
          },
          state: {
            user,
          },
        }) as any;
        previousPassword = user.password;

        await RefreshTokenMock.create({ userId: user._id });

        await handler(ctx);
      });

      it('returns a 200 status code', async function() {
        expect(ctx.response.status).to.eql(200);
      });

      it(`updates the User's password`, async function() {
        const updatedUser = await User.findById(user._id);
        expect(updatedUser.password).to.not.eql(previousPassword);
      });

      it(`removes all the User's RefreshTokens`, async function() {
        const count = await RefreshToken.countDocuments({ userId: user._id });
        expect(count).to.eql(0);
      });
    });
  });
});
