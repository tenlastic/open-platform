import { ContextMock, RequiredFieldError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { RefreshTokenMock, UserDocument, UserMock } from '../../../models';
import { handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/logins/refresh-token', function() {
  beforeEach(async function() {
    await UserMock.create({ password: 'password' });
  });

  context('when a token is not provided', function() {
    it('throws an error', async function() {
      const ctx: any = new ContextMock();

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(
        RequiredFieldError,
        'Missing required field: token.',
      );
    });
  });

  context('when a token is provided', function() {
    context('when the JWT fails verification', function() {
      it('throws an error', async function() {
        const token = jwt.sign({}, chance.hash());
        const ctx: any = new ContextMock({
          request: {
            body: { token },
          },
        });

        const promise = handler(ctx);

        return expect(promise).to.be.rejectedWith('Invalid refresh token.');
      });
    });

    context('when the JWT passes verification', function() {
      context('when the JWT does not include required parameters', function() {
        it('throws an error', async function() {
          const token = jwt.sign({}, process.env.JWT_SECRET);
          const ctx: any = new ContextMock({
            request: {
              body: { token },
            },
          });

          const promise = handler(ctx);

          return expect(promise).to.be.rejectedWith('Invalid refresh token.');
        });
      });

      context('when the JWT includes required parameters', function() {
        context('when the RefreshToken is not in the database', function() {
          it('throws an error', async function() {
            const user = await UserMock.create();
            const token = jwt.sign({ user }, process.env.JWT_SECRET, { jwtid: chance.hash() });
            const ctx: any = new ContextMock({
              request: {
                body: { token },
              },
            });

            const promise = handler(ctx);

            return expect(promise).to.be.rejectedWith('Invalid refresh token.');
          });
        });

        context('when the RefreshToken is in the database', function() {
          context('when the user does not exist', function() {
            it('throws an error', async function() {
              const user = await UserMock.create();
              const refreshToken = await RefreshTokenMock.create({
                userId: mongoose.Types.ObjectId() as any,
              });
              const token = jwt.sign({ user }, process.env.JWT_SECRET, { jwtid: refreshToken.jti });
              const ctx: any = new ContextMock({
                request: {
                  body: { token },
                },
              });

              const promise = handler(ctx);

              return expect(promise).to.be.rejectedWith('Invalid refresh token.');
            });
          });

          context('when the user is exists', function() {
            it('returns an accessToken and refreshToken', async function() {
              const user = await UserMock.create();
              const refreshToken = await RefreshTokenMock.create({ userId: user._id });
              const token = jwt.sign({ user }, process.env.JWT_SECRET, { jwtid: refreshToken.jti });
              const ctx: any = new ContextMock({
                request: {
                  body: { token },
                },
              });

              await handler(ctx);

              expect(ctx.response.body.accessToken).to.exist;
              expect(ctx.response.body.refreshToken).to.exist;
            });
          });
        });
      });
    });
  });
});
