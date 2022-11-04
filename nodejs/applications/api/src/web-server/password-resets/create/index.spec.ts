import { Context, ContextMock, RequiredFieldError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { PasswordReset, UserDocument, UserMock } from '../../../mongodb';
import { handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/password-resets/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when email is not provided', function () {
    it('throws an error', async function () {
      const ctx = new ContextMock({
        request: {
          body: {},
        },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        RequiredFieldError,
        'Missing required field: email.',
      );
    });
  });

  context('when email is provided', function () {
    context('when User exists', function () {
      let ctx: Context;

      beforeEach(async function () {
        ctx = new ContextMock({
          request: {
            body: {
              email: user.email,
            },
          },
        }) as any;

        await handler(ctx);
      });

      it('returns a 200 status code', function () {
        expect(ctx.response.status).to.eql(200);
      });

      it('creates a PasswordReset', async function () {
        const passwordReset = await PasswordReset.findOne({ userId: user._id });
        expect(passwordReset).to.exist;
      });
    });

    context('when User does not exist', function () {
      it('returns a 200 status', async function () {
        const ctx = new ContextMock({
          request: {
            body: {
              email: chance.email(),
            },
          },
        });

        await handler(ctx as any);

        expect(ctx.response.status).to.eql(200);
      });
    });
  });
});
