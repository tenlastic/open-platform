import { PasswordResetModel, UserDocument, UserModel } from '@tenlastic/mongoose';
import { ContextMock, RequiredFieldError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import { CreatePasswordResetContext, handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/password-resets/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when email is not provided', function () {
    it('throws an error', async function () {
      const ctx = ContextMock<CreatePasswordResetContext>();

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(
        RequiredFieldError,
        'Missing required field: email.',
      );
    });
  });

  context('when email is provided', function () {
    context('when User exists', function () {
      let ctx: CreatePasswordResetContext;

      beforeEach(async function () {
        ctx = ContextMock<CreatePasswordResetContext>({
          request: {
            body: {
              email: user.email,
            },
          },
        });

        await handler(ctx);
      });

      it('returns a 200 status code', function () {
        expect(ctx.response.status).to.eql(200);
      });

      it('creates a PasswordReset', async function () {
        const passwordReset = await PasswordResetModel.findOne({ userId: user._id });
        expect(passwordReset).to.exist;
      });
    });

    context('when User does not exist', function () {
      it('returns a 200 status', async function () {
        const ctx = ContextMock<CreatePasswordResetContext>({
          request: {
            body: {
              email: chance.email(),
            },
          },
        });

        await handler(ctx);

        expect(ctx.response.status).to.eql(200);
      });
    });
  });
});
