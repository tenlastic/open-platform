import {
  PasswordResetDocument,
  PasswordResetModel,
  RefreshTokenModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { Context, ContextMock, RequiredFieldError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/password-resets/delete', function () {
  let record: PasswordResetDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
    record = await PasswordResetModel.mock({ userId: user._id }).save();
  });

  context('when password is not provided', function () {
    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: {
          hash: record.hash,
        },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        RequiredFieldError,
        'Missing required field: password.',
      );
    });
  });

  context('when password is provided', function () {
    context('when hash is invalid', function () {
      it('returns a 200 status code', async function () {
        const ctx = new ContextMock({
          params: {
            hash: chance.hash({ length: 128 }),
          },
          request: {
            query: {
              password: chance.hash(),
            },
          },
        });

        await handler(ctx as any);

        expect(ctx.response.status).eql(200);
      });
    });

    context('when hash is valid', function () {
      let ctx: Context;
      let previousPassword: string;

      beforeEach(async function () {
        ctx = new ContextMock({
          params: {
            hash: record.hash,
          },
          request: {
            query: {
              password: chance.hash(),
            },
          },
          state: {
            user,
          },
        }) as any;
        previousPassword = user.password;

        await RefreshTokenModel.mock({ userId: user._id }).save();

        await handler(ctx);
      });

      it('returns a 200 status code', async function () {
        expect(ctx.response.status).to.eql(200);
      });

      it(`updates the User's password`, async function () {
        const updatedUser = await UserModel.findOne({ _id: user._id });
        expect(updatedUser.password).to.not.eql(previousPassword);
      });

      it(`removes all the User's RefreshTokens`, async function () {
        const count = await RefreshTokenModel.countDocuments({ userId: user._id });
        expect(count).to.eql(0);
      });
    });
  });
});
